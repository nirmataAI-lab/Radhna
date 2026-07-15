import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/create-category.dto';
import {
  CreateFoodItemDto,
  UpdateFoodItemDto,
} from './dto/create-food-item.dto';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // ─── Public Endpoints ──────────────────────────────

  @Get('categories')
  @ApiOperation({
    summary: 'Get active categories',
    description:
      'Returns all categories ordered by display order. Public endpoint.',
  })
  getCategories() {
    return this.menuService.getCategories();
  }

  @Get('items')
  @ApiOperation({
    summary: 'Get available food items',
    description:
      'Returns enabled food items. Optionally filter by category. Public endpoint.',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  getFoodItems(@Query('categoryId') categoryId?: string) {
    return this.menuService.getFoodItems(categoryId);
  }

  @Get('specials')
  @ApiOperation({
    summary: "Get today's specials",
    description:
      "Returns all items marked as today's special. Public endpoint.",
  })
  getTodaysSpecials() {
    return this.menuService.getTodaysSpecials();
  }

  // ─── Admin Category CRUD ───────────────────────────

  @Get('categories/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.CHIEF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all categories (admin)',
    description: 'Returns all categories including disabled ones.',
  })
  getAllCategories() {
    return this.menuService.getCategories();
  }

  @Get('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.CHIEF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID (UUID)' })
  getCategory(@Param('id') id: string) {
    return this.menuService.getCategory(id);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.CHIEF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create category' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.CHIEF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update category' })
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.menuService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.CHIEF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete category',
    description: 'Fails if category has food items.',
  })
  deleteCategory(@Param('id') id: string) {
    return this.menuService.deleteCategory(id);
  }

  // ─── Admin Food Item CRUD ──────────────────────────

  @Get('items/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.CHIEF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all food items (admin)',
    description: 'Returns all items including disabled ones.',
  })
  @ApiQuery({ name: 'categoryId', required: false })
  getAllFoodItems(@Query('categoryId') categoryId?: string) {
    if (categoryId) {
      return this.menuService.getFoodItems(categoryId);
    }
    return this.menuService.getAllFoodItems();
  }

  @Get('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.CHIEF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get food item by ID' })
  getFoodItem(@Param('id') id: string) {
    return this.menuService.getFoodItem(id);
  }

  @Post('items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.CHIEF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create food item' })
  createFoodItem(@Body() dto: CreateFoodItemDto) {
    return this.menuService.createFoodItem(dto);
  }

  @Patch('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.CHIEF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update food item' })
  updateFoodItem(@Param('id') id: string, @Body() dto: UpdateFoodItemDto) {
    return this.menuService.updateFoodItem(id, dto);
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.CHIEF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete food item' })
  deleteFoodItem(@Param('id') id: string) {
    return this.menuService.deleteFoodItem(id);
  }

  // ─── Production Stock (Chief + Admin) ──────────────

  @Get('stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.CHIEF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List production stock for all enabled items',
    description:
      'Returns every enabled food item with current availableQty. Used by the Chief prep-stock screen and Admin dashboards.',
  })
  listStock() {
    return this.menuService.listStock();
  }

  @Patch('items/:id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.CHIEF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Set daily production stock for an item',
    description:
      'Chief sets morning batch quantity (e.g. 50 burgers). Auto-decrements on order placement and restores on cancellation.',
  })
  setStock(
    @Param('id') id: string,
    @Body() body: { availableQty: number },
    @Req() req: any,
  ) {
    return this.menuService.setStock(id, body.availableQty, req.user?.userId);
  }
}

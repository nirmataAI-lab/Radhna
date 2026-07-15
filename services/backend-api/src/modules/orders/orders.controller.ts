import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseEnumPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrderStatus, Role } from '@prisma/client';
import type { Request } from 'express';

const STAFF: Role[] = [Role.SUPER_ADMIN, Role.CHIEF];

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ─── Public Endpoints ──────────────────────────────

  @Post()
  @ApiOperation({
    summary: 'Place a new order',
    description:
      'Public endpoint. Creates an order with optional customer linking and table assignment.',
  })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get('track/:id')
  @ApiOperation({
    summary: 'Track an order by ID',
    description:
      'Public endpoint. Returns order status, items, and table info.',
  })
  @ApiParam({ name: 'id', description: 'Order ID (UUID)' })
  trackOrder(@Param('id') id: string) {
    return this.ordersService.trackOrder(id);
  }

  // ─── Customer Authenticated Endpoints ──────────────

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get customer orders',
    description: "Returns the logged-in customer's order history.",
  })
  getMyOrders(@Req() req: Request) {
    const userId = (req as any).user?.userId;
    return this.ordersService.findByCustomer(userId);
  }

  // ─── Admin/Chief Protected Endpoints ───────────────

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get business analytics',
    description:
      'Returns revenue trends, popular items, peak hours, and daily breakdown.',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to analyze (default: 30)',
  })
  getAnalytics(@Query('days') days?: string) {
    return this.ordersService.getAnalytics(days ? parseInt(days, 10) : 30);
  }

  @Get('recent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get recent orders since timestamp',
    description:
      'Returns orders created after the given ISO timestamp. Used for admin notification polling.',
  })
  @ApiQuery({
    name: 'since',
    required: true,
    description: 'ISO timestamp (e.g. 2025-01-01T00:00:00.000Z)',
  })
  getRecentOrders(@Query('since') since?: string) {
    return this.ordersService.findRecent(since || new Date(0).toISOString());
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get daily overview stats',
    description: "Returns today's revenue, total orders, and active tables.",
  })
  getOverview() {
    return this.ordersService.getOverviewStats();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List orders',
    description: 'Returns all orders with optional status/table filtering.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status (comma-separated)',
  })
  @ApiQuery({
    name: 'table',
    required: false,
    description: 'Filter by table number',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (max 100)',
  })
  findAll(
    @Query('status') status?: string,
    @Query('table') table?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (table) return this.ordersService.findByTable(table);
    return this.ordersService.findAll(
      status,
      page ? parseInt(page, 10) : 1,
      limit ? Math.min(parseInt(limit, 10), 100) : 20,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get order by ID',
    description:
      'Returns full order details including items, payments, and customer info.',
  })
  @ApiParam({ name: 'id', description: 'Order ID (UUID)' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update order status',
    description:
      'Updates the order status following the valid state machine transitions.',
  })
  @ApiParam({ name: 'id', description: 'Order ID (UUID)' })
  @ApiBody({
    schema: {
      properties: {
        status: {
          type: 'string',
          enum: [
            'PLACED',
            'ACCEPTED',
            'PREPARING',
            'READY',
            'COMPLETED',
            'CANCELLED',
          ],
        },
      },
    },
  })
  updateStatus(
    @Param('id') id: string,
    @Body('status', new ParseEnumPipe(OrderStatus)) status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cancel an order',
    description: 'Cancels an order with an optional reason.',
  })
  @ApiParam({ name: 'id', description: 'Order ID (UUID)' })
  cancelOrder(@Param('id') id: string, @Body('reason') _reason: string) {
    return this.ordersService.updateStatus(id, OrderStatus.CANCELLED);
  }
}

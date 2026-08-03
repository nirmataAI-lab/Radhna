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

  // ─── Public / customer ─────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Place a new order (takeaway)' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get('track/:id')
  @ApiOperation({ summary: 'Track an order by ID (public)' })
  @ApiParam({ name: 'id', description: 'Order ID (UUID)' })
  trackOrder(@Param('id') id: string) {
    return this.ordersService.trackOrder(id);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get logged-in customer order history' })
  getMyOrders(@Req() req: Request) {
    const user = (req as any).user;
    return this.ordersService.findByCustomer(user?.userId, user?.email);
  }

  @Patch(':id/cancel-mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cancel my own order (only while status = PLACED)',
  })
  cancelMine(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.userId;
    return this.ordersService.cancelByCustomer(id, userId, reason);
  }

  // ─── Staff (SUPER_ADMIN | CHIEF) ───────────────────

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Business analytics' })
  @ApiQuery({ name: 'days', required: false })
  getAnalytics(@Query('days') days?: string) {
    return this.ordersService.getAnalytics(days ? parseInt(days, 10) : 30);
  }

  @Get('recent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Recent orders since timestamp (poll)' })
  @ApiQuery({ name: 'since', required: true })
  getRecentOrders(@Query('since') since?: string) {
    return this.ordersService.findRecent(since || new Date(0).toISOString());
  }

  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Today's overview stats" })
  getOverview() {
    return this.ordersService.getOverviewStats();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List orders' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
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
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID (UUID)' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update order status' })
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

  @Patch(':id/payment-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update payment status' })
  @ApiParam({ name: 'id', description: 'Order ID (UUID)' })
  @ApiBody({ schema: { properties: { status: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] } } } })
  updatePaymentStatus(
    @Param('id') id: string,
    @Body('status') status: any,
  ) {
    return this.ordersService.updatePaymentStatus(id, status);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel an order (staff)' })
  @ApiParam({ name: 'id', description: 'Order ID (UUID)' })
  cancelOrder(@Param('id') id: string, @Body('reason') reason: string) {
    return this.ordersService.updateStatus(
      id,
      OrderStatus.CANCELLED,
      reason || 'Cancelled by staff',
    );
  }

  @Patch(':id/recall')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...STAFF)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Recall a READY or COMPLETED order back to the kitchen',
  })
  @ApiParam({ name: 'id', description: 'Order ID (UUID)' })
  @ApiBody({
    required: false,
    schema: { properties: { reason: { type: 'string' } } },
  })
  recallOrder(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.ordersService.recall(id, reason);
  }
}

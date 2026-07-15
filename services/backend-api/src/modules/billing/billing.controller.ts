import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Headers,
  Req,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post(':orderId/create-order')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create Razorpay order',
    description:
      'Initiates payment for an order. Returns Razorpay order details for client-side checkout.',
  })
  @ApiParam({ name: 'orderId', description: 'Order ID (UUID)' })
  async createPaymentOrder(@Param('orderId') orderId: string) {
    return this.billingService.createPaymentOrder(orderId);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify payment',
    description:
      'Verifies Razorpay payment signature after successful checkout.',
  })
  async verifyPayment(
    @Body()
    dto: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      orderId: string;
    },
  ) {
    return this.billingService.verifyPayment(dto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Razorpay webhook',
    description:
      'Receives payment events from Razorpay server-to-server. Verifies HMAC signature.',
  })
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing webhook signature');
    }
    return this.billingService.handleWebhook(
      (req as any).rawBody || JSON.stringify(req.body),
      signature,
    );
  }

  @Get(':orderId/payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get payment history',
    description: 'Returns all payments for a given order.',
  })
  async getPayments(@Param('orderId') orderId: string) {
    return this.billingService.getPaymentsByOrder(orderId);
  }
}

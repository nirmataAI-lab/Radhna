import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private razorpay: Razorpay | null = null;

  constructor(private prisma: PrismaService) {
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (keyId && keySecret) {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } else {
      this.logger.warn(
        'RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — payments disabled',
      );
    }
  }

  /**
   * Create a Razorpay order for a given order ID.
   * Returns the Razorpay order object so the frontend can initiate checkout.
   */
  async createPaymentOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found`);
    }

    if (!this.razorpay) {
      throw new BadRequestException(
        'Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      );
    }

    const amountInPaise = Math.round(Number(order.total) * 100);

    try {
      const razorpayOrder = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderId,
        notes: { orderId },
      });

      this.logger.log(
        `Razorpay order created: ${razorpayOrder.id} for order ${orderId}`,
      );

      return {
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId,
      };
    } catch (err: any) {
      this.logger.error(`Failed to create Razorpay order: ${err.message}`);
      throw new BadRequestException(
        'Failed to initiate payment. Please try again.',
      );
    }
  }

  /**
   * Verify the payment signature after successful Razorpay checkout.
   * Creates or updates the Payment record using the gateway reference.
   */
  async verifyPayment(dto: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderId: string;
  }) {
    const body = dto.razorpayOrderId + '|' + dto.razorpayPaymentId;
    const isValid = this.verifySignature(
      body,
      process.env.RAZORPAY_KEY_SECRET || '',
      dto.razorpaySignature,
    );

    if (!isValid) {
      this.logger.warn(`Payment signature mismatch for order ${dto.orderId}`);
      throw new BadRequestException('Invalid payment signature');
    }

    const updatedOrder = await this.processSuccessfulPayment(
      dto.orderId,
      dto.razorpayPaymentId,
      0, // amount updated by webhook
    );

    this.logger.log(`Payment verified for order ${dto.orderId}`);

    return {
      success: true,
      order: updatedOrder,
    };
  }

  /**
   * Verify Razorpay webhook signature and handle payment events.
   * Used for server-to-server payment confirmation.
   */
  async handleWebhook(rawBody: string, signature: string) {
    const isValid = this.verifySignature(
      rawBody,
      process.env.RAZORPAY_WEBHOOK_SECRET || '',
      signature,
    );

    if (!isValid) {
      this.logger.warn('Webhook signature verification failed');
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody);
    this.logger.log(`Webhook event received: ${event.event}`);

    if (event.event === 'payment.captured' && event.payload?.payment?.entity) {
      const payment = event.payload.payment.entity;
      const orderId = payment.notes?.orderId;
      const gatewayRef = payment.id;

      if (orderId) {
        await this.processSuccessfulPayment(
          orderId,
          gatewayRef,
          Number(payment.amount) / 100,
        );
        this.logger.log(`Webhook: Payment confirmed for order ${orderId}`);
      }
    }

    return { received: true };
  }

  /**
   * Get payment history for an order
   */
  async getPaymentsByOrder(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private verifySignature(payload: string, secret: string, signature: string): boolean {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return expected === signature;
  }

  private async processSuccessfulPayment(
    orderId: string,
    gatewayRef: string,
    amount: number,
  ) {
    const existing = await this.prisma.payment.findFirst({
      where: { gatewayRef },
    });

    if (existing) {
      await this.prisma.payment.update({
        where: { id: existing.id },
        data: {
          amount: amount > 0 ? amount : existing.amount,
          status: PaymentStatus.PAID,
        },
      });
    } else {
      await this.prisma.payment.create({
        data: {
          orderId,
          method: PaymentMethod.UPI,
          amount,
          gatewayRef,
          status: PaymentStatus.PAID,
        },
      });
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: PaymentStatus.PAID },
      include: {
        orderItems: { include: { foodItem: true } },
      },
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Twilio } from 'twilio';

/**
 * SMS notification service for order status updates.
 *
 * Configure via env vars:
 *   TWILIO_ACCOUNT_SID=your_account_sid
 *   TWILIO_AUTH_TOKEN=your_auth_token
 *   TWILIO_PHONE_NUMBER=+1234567890
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: Twilio | null = null;
  private readonly fromNumber: string;
  private readonly isConfigured: boolean;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (accountSid && authToken && this.fromNumber) {
      this.client = new Twilio(accountSid, authToken);
      this.isConfigured = true;
      this.logger.log('Twilio SMS service configured');
    } else {
      this.isConfigured = false;
      this.logger.warn(
        'Twilio not configured (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER). ' +
          'SMS will be logged to console only.',
      );
    }
  }

  /**
   * Send an order status update via SMS.
   */
  async sendOrderStatus(
    to: string,
    orderId: string,
    status: string,
  ): Promise<{ success: boolean; sid?: string; error?: string }> {
    const message = this.buildSmsMessage(orderId, status);

    if (!this.isConfigured || !this.client) {
      this.logger.log(`[SMS PREVIEW] To: ${to} | Message: ${message}`);
      return { success: true };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to,
      });
      this.logger.log(`SMS sent to ${to}: ${result.sid}`);
      return { success: true, sid: result.sid };
    } catch (err: any) {
      this.logger.error(`Failed to send SMS to ${to}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  private buildSmsMessage(orderId: string, status: string): string {
    const shortId = orderId.slice(-8).toUpperCase();
    const statusMessages: Record<string, string> = {
      PLACED: `✅ Order #${shortId} placed! We've received it and will start preparing shortly. — Radhna Cuisine`,
      ACCEPTED: `👨‍🍳 Order #${shortId} accepted! Our chefs are getting ready to prepare your meal. — Radhna Cuisine`,
      PREPARING: `🔥 Order #${shortId} is now being prepared! Freshly cooked just for you. — Radhna Cuisine`,
      READY: `🛎️ Order #${shortId} is ready! Please pick up from the counter. Enjoy your meal! — Radhna Cuisine`,
      COMPLETED: `🎉 Order #${shortId} completed! Thank you for dining with us. We hope you enjoyed it! — Radhna Cuisine`,
      CANCELLED: `❌ Order #${shortId} has been cancelled. Contact us for any concerns. — Radhna Cuisine`,
    };
    return (
      statusMessages[status] ||
      `Order #${shortId} status updated to ${status}. — Radhna Cuisine`
    );
  }
}

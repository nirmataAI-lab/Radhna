import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * Email notification service for order status updates.
 *
 * Supports two modes:
 * 1. SMTP (via Nodemailer) — works with any transactional email provider
 * 2. Dev/Preview mode — logs emails to console when SMTP is not configured
 *
 * Configure via env vars:
 *   SMTP_HOST=smtp.example.com
 *   SMTP_PORT=587
 *   SMTP_USER=your@email.com
 *   SMTP_PASS=your-password
 *   EMAIL_FROM=noreply@radhnacuisine.com
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;
  private readonly isConfigured: boolean;

  constructor() {
    this.fromAddress = process.env.EMAIL_FROM || 'noreply@radhnacuisine.com';

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        // Enable preview in dev via ethereal.email if no host configured differently
      });
      this.isConfigured = true;
      this.logger.log(`Email service configured: ${host}:${port}`);
    } else {
      this.isConfigured = false;
      this.logger.warn(
        'SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS). ' +
          'Emails will be logged to console only.',
      );
    }
  }

  /**
   * Send an order status update email.
   *
   * @param to - Recipient email address
   * @param orderId - The order ID for reference
   * @param status - Human-readable status string
   * @param details - Order item details
   */
  async sendOrderStatus(
    to: string,
    orderId: string,
    status: string,
    details: { items?: string; total?: string },
  ) {
    const subject = this.getSubjectLine(status, orderId);
    const html = this.buildOrderEmailHtml(orderId, status, details);

    if (!this.isConfigured || !this.transporter) {
      this.logger.log(`[EMAIL PREVIEW] To: ${to} | Subject: ${subject}`);
      this.logger.log(`[EMAIL PREVIEW] Body:\n${html.substring(0, 500)}...`);
      return { preview: true, to, subject };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Radhna Cuisine" <${this.fromAddress}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      // Don't throw — email failure shouldn't break order flow
      return { success: false, error: err.message };
    }
  }

  /**
   * Send order confirmation email after order creation.
   */
  async sendOrderConfirmation(
    to: string,
    orderId: string,
    details: { items?: string; total?: string },
  ) {
    return this.sendOrderStatus(to, orderId, 'CONFIRMED', details);
  }

  private getSubjectLine(status: string, orderId: string): string {
    const shortId = orderId.slice(-8);
    const statusLabels: Record<string, string> = {
      PLACED: 'Order Placed',
      CONFIRMED: 'Order Confirmed',
      ACCEPTED: 'Order Accepted',
      PREPARING: 'Being Prepared',
      READY: 'Ready for Pickup',
      COMPLETED: 'Order Completed',
      CANCELLED: 'Order Cancelled',
    };
    const label = statusLabels[status] || status;
    return `[Radhna Cuisine] ${label} — #${shortId}`;
  }

  private buildOrderEmailHtml(
    orderId: string,
    status: string,
    details: { items?: string; total?: string },
  ): string {
    const shortId = orderId.slice(-8).toUpperCase();
    const statusEmojis: Record<string, string> = {
      PLACED: '📋',
      CONFIRMED: '✅',
      ACCEPTED: '👨‍🍳',
      PREPARING: '🔥',
      READY: '🛎️',
      COMPLETED: '🎉',
      CANCELLED: '❌',
    };
    const emoji = statusEmojis[status] || '📬';

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Inter', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
        <h1 style="color: white; font-size: 28px; margin: 0;">${emoji} ${this.getSubjectLine(status, orderId)}</h1>
      </td>
    </tr>
    <tr>
      <td style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <p style="font-size: 16px; color: #334155; margin: 0 0 16px 0;">Hi there,</p>
        <p style="font-size: 16px; color: #334155; margin: 0 0 16px 0;">
          Your order <strong style="color: #10b981;">#${shortId}</strong> has been updated.
        </p>

        <table width="100%" cellpadding="8" style="background: #f1f5f9; border-radius: 8px; margin-bottom: 16px;">
          ${details.items ? `<tr><td style="font-size: 14px; color: #64748b;">Items</td><td style="font-size: 14px; font-weight: 600;">${details.items}</td></tr>` : ''}
          ${details.total ? `<tr><td style="font-size: 14px; color: #64748b;">Total</td><td style="font-size: 14px; font-weight: 600;">${details.total}</td></tr>` : ''}
          <tr><td style="font-size: 14px; color: #64748b;">Order ID</td><td style="font-size: 14px; font-weight: 600; font-family: monospace;">${orderId}</td></tr>
        </table>

        <a href="${process.env.CUSTOMER_URL || 'http://localhost:3001'}/order/${orderId}"
           style="display: inline-block; background: #10b981; color: white; text-decoration: none;
                  padding: 12px 24px; border-radius: 999px; font-weight: 600; font-size: 14px;">
          Track Your Order →
        </a>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
          Radhna Cuisine — Experience the taste<br />
          Need help? Contact us at support@radhnacuisine.com
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}

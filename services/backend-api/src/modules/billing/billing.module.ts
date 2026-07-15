import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { WebhookProcessor } from './webhook.processor';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'webhooks',
    }),
  ],
  controllers: [BillingController],
  providers: [BillingService, WebhookProcessor],
  exports: [BillingService],
})
export class BillingModule {}

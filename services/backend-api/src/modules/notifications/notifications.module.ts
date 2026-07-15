import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [EmailService, SmsService, NotificationsService],
  exports: [EmailService, SmsService, NotificationsService],
})
export class NotificationsModule {}

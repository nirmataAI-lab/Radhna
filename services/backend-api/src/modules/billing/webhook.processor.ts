import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { BillingService } from './billing.service';

@Processor('webhooks')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly billingService: BillingService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing webhook job ${job.id} of type ${job.name}`);
    
    if (job.name === 'razorpay.event') {
      const { rawBody, signature } = job.data;
      try {
        await this.billingService.handleWebhook(rawBody, signature);
        this.logger.log(`Successfully processed webhook job ${job.id}`);
      } catch (error: any) {
        this.logger.error(`Failed to process webhook job ${job.id}: ${error.message}`);
        throw error;
      }
    }
  }
}

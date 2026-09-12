import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WebhooksService } from './webhooks.service';

@Injectable()
@Processor('webhooks')
export class WebhooksProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhooksProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { webhookEventId, url, secret, eventType, payload } = job.data;
    const body = JSON.stringify({ type: eventType, data: payload });
    const signature = WebhooksService.sign(secret, body);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-FleetFlow-Signature': signature,
        },
        body,
      });

      if (!response.ok) throw new Error(`Webhook endpoint responded ${response.status}`);

      await this.prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: { status: 'DELIVERED', attempts: { increment: 1 } },
      });
    } catch (err) {
      await this.prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: { status: 'FAILED', attempts: { increment: 1 } },
      });
      this.logger.warn(`Webhook delivery failed (will retry via BullMQ backoff): ${(err as Error).message}`);
      throw err; // rethrow so BullMQ applies its retry/backoff policy
    }
  }
}

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createHmac, randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';

const EVENT_TYPE_MAP: Record<string, string> = {
  'order.created': 'order.created',
  'order.assigned': 'driver.assigned',
  'order.status_changed': 'order.updated',
};

@Injectable()
export class WebhooksService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('webhooks') private readonly webhooksQueue: Queue,
  ) {}

  @OnEvent('order.created')
  @OnEvent('order.assigned')
  @OnEvent('order.status_changed')
  async onDomainEvent(payload: { companyId: string; [key: string]: unknown }, eventName?: string) {
    const eventType = EVENT_TYPE_MAP[eventName ?? ''] ?? 'unknown';

    const webhooks = await this.prisma.webhook.findMany({
      where: { companyId: payload.companyId, events: { has: eventType } },
    });

    for (const webhook of webhooks) {
      const idempotencyKey = `${webhook.id}:${eventType}:${JSON.stringify(payload)}`;
      const record = await this.prisma.webhookEvent.create({
        data: { webhookId: webhook.id, eventType, payload: payload as any, idempotencyKey: randomUUID() },
      });

      await this.webhooksQueue.add(
        'deliver',
        { webhookEventId: record.id, url: webhook.url, secret: webhook.secret, eventType, payload },
        {
          attempts: 8,
          backoff: { type: 'exponential', delay: 5000 },
          // BullMQ-level idempotency: same webhookEventId never double-enqueued
          jobId: record.id,
        },
      );
    }
  }

  /** HMAC-SHA256 signature the receiving endpoint can verify. */
  static sign(secret: string, body: string): string {
    return createHmac('sha256', secret).update(body).digest('hex');
  }
}

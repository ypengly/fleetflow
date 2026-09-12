import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';

interface OrderEventPayload {
  orderId: string;
  companyId: string;
  actorId: string;
  [key: string]: unknown;
}

@Injectable()
export class NotificationsListener {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) {}

  @OnEvent('order.created')
  @OnEvent('order.assigned')
  @OnEvent('order.status_changed')
  async onOrderEvent(payload: OrderEventPayload) {
    // Enqueue rather than send inline — notification delivery (email/SMS/
    // push) should never block or fail the request that triggered it
    // (architecture doc §12).
    await this.notificationsQueue.add('deliver', payload, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }
}

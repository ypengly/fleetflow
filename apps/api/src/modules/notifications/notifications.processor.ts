import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { companyId, actorId, orderId } = job.data;

    // Persist an in-app notification row (email/SMS providers would be
    // called here too, behind the EMAIL_PROVIDER/SMS_PROVIDER config —
    // "console" provider just logs, for local dev).
    await this.prisma.notification.create({
      data: {
        companyId,
        userId: actorId,
        type: job.name,
        payload: { orderId, event: job.name },
      },
    });
  }
}

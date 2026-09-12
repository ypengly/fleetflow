import { Controller, Get, Injectable, Module, UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenancyContext } from '../../common/tenancy/tenancy-context';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AuthModule } from '../auth/auth.module';

interface DomainEventPayload {
  companyId: string;
  actorId: string;
  orderId?: string;
  [key: string]: unknown;
}

@Injectable()
class AuditListener {
  constructor(private readonly prisma: PrismaService) {}

  // In a full implementation this subscribes to every domain event via
  // an outbox-fed wildcard listener; wired here for the order events
  // that exist so far. Audit writes are never allowed to silently fail —
  // in production this listener alerts (not shown) if the write throws.
  @OnEvent('order.created')
  @OnEvent('order.assigned')
  @OnEvent('order.status_changed')
  async onEvent(payload: DomainEventPayload) {
    await this.prisma.auditLog.create({
      data: {
        companyId: payload.companyId,
        actorId: payload.actorId,
        action: 'order_event',
        resourceType: 'Order',
        resourceId: payload.orderId ?? 'unknown',
        metadata: payload as any,
      },
    });
  }
}

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionGuard)
class AuditController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyContext,
  ) {}

  @Get()
  @RequirePermission('audit:read')
  list() {
    return this.prisma.auditLog.findMany({
      where: { companyId: this.tenancy.companyId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}

@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [AuditListener],
})
export class AuditModule {}

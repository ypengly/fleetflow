import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenancyContext } from '../../common/tenancy/tenancy-context';

const CACHE_TTL_SECONDS = 300; // 5 min — see architecture doc §11 on why this is scheduled, not event-driven

@Injectable()
export class AnalyticsService {
  private readonly redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyContext,
  ) {}

  async overview() {
    const companyId = this.tenancy.companyId;
    const cacheKey = `analytics:overview:${companyId}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const [totalOrders, delivered, failed] = await Promise.all([
      this.prisma.order.count({ where: { companyId } }),
      this.prisma.order.count({ where: { companyId, status: 'DELIVERED' } }),
      this.prisma.order.count({ where: { companyId, status: 'FAILED' } }),
    ]);

    const onTimeRate = totalOrders > 0 ? delivered / totalOrders : 0;

    const result = {
      totalOrders,
      delivered,
      failed,
      onTimeRate,
      computedAt: new Date().toISOString(),
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL_SECONDS);
    return result;
  }
}

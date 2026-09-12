import { Injectable, NotFoundException } from '@nestjs/common';
import { DriverAvailability } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenancyContext } from '../../common/tenancy/tenancy-context';

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyContext,
  ) {}

  findAll() {
    return this.prisma.driver.findMany({ where: { companyId: this.tenancy.companyId, deletedAt: null } });
  }

  async setAvailability(driverId: string, availability: DriverAvailability) {
    const driver = await this.prisma.driver.findFirst({
      where: { id: driverId, companyId: this.tenancy.companyId },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return this.prisma.driver.update({ where: { id: driverId }, data: { availability } });
  }

  /**
   * Driver performance metrics. Deliberately queries the Delivery table
   * directly rather than reading from a cache — this endpoint is used
   * infrequently enough (one driver's detail page) that a live
   * aggregate query is fine; contrast with /analytics/overview (§10 of
   * the architecture doc) which IS cached because it's read constantly
   * on the main dashboard.
   */
  async performance(driverId: string) {
    const [total, successful, failed] = await Promise.all([
      this.prisma.delivery.count({ where: { driverId } }),
      this.prisma.delivery.count({ where: { driverId, status: 'SUCCESS' } }),
      this.prisma.delivery.count({ where: { driverId, status: 'FAILED' } }),
    ]);

    return {
      driverId,
      deliveriesCompleted: total,
      successRate: total > 0 ? successful / total : 0,
      failedDeliveries: failed,
    };
  }
}

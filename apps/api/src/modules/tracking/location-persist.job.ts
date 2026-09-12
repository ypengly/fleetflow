import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LocationBufferService } from './location-buffer.service';

/**
 * Runs every 10s: for each driver with buffered points, does one
 * batched createMany into DriverLocation instead of one insert per
 * ping. This is the persistence half of the strategy described in
 * architecture doc §11 — Redis absorbs the write rate, Postgres gets
 * periodic, bounded-size batches.
 */
@Injectable()
export class LocationPersistJob {
  constructor(
    private readonly prisma: PrismaService,
    private readonly buffer: LocationBufferService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async flushAll() {
    const driverIds = await this.buffer.listBufferedDriverIds();

    for (const driverId of driverIds) {
      const points = await this.buffer.drain(driverId);
      if (points.length === 0) continue;

      await this.prisma.driverLocation.createMany({
        data: points.map((p) => ({
          driverId,
          lat: p.lat,
          lng: p.lng,
          speed: p.speed ?? null,
          heading: p.heading ?? null,
          recordedAt: new Date(p.ts),
        })),
      });
    }
  }
}

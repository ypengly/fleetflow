import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenancyContext } from '../../common/tenancy/tenancy-context';
import { optimizeRoute, haversineDistanceKm } from './domain/optimize-route';

@Injectable()
export class RoutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyContext,
  ) {}

  findAll() {
    return this.prisma.route.findMany({
      where: { driver: { companyId: this.tenancy.companyId } },
      include: { stops: true },
    });
  }

  async optimize(routeId: string, origin: { lat: number; lng: number }) {
    const route = await this.prisma.route.findFirst({
      where: { id: routeId },
      include: { stops: { include: { order: true } } },
    });
    if (!route) throw new NotFoundException('Route not found');

    const stopInputs = route.stops.map((s) => ({
      orderId: s.orderId,
      lat: (s.order.deliveryAddress as any).lat,
      lng: (s.order.deliveryAddress as any).lng,
    }));

    const ordered = optimizeRoute(origin, stopInputs);

    let totalDistanceKm = 0;
    let cursor = origin;
    for (const stop of ordered) {
      totalDistanceKm += haversineDistanceKm(cursor, stop);
      cursor = stop;
    }

    await this.prisma.$transaction(
      ordered.map((stop, index) =>
        this.prisma.routeStop.updateMany({
          where: { routeId, orderId: stop.orderId },
          data: { sequence: index + 1 },
        }),
      ),
    );

    return this.prisma.route.update({
      where: { id: routeId },
      data: { estimatedDistanceKm: totalDistanceKm },
      include: { stops: { orderBy: { sequence: 'asc' } } },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ShipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public, unauthenticated lookup by tracking number. Deliberately
   * selects only shipment-safe fields — never the linked Order's
   * customer/payment data — since this backs the public
   * /track/[trackingNumber] page (architecture doc §7, §8).
   */
  async trackByNumber(trackingNumber: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { trackingNumber },
      select: {
        trackingNumber: true,
        status: true,
        createdAt: true,
        order: {
          select: {
            estimatedDeliveryAt: true,
            pickupAddress: true,
            deliveryAddress: true,
          },
        },
        deliveries: {
          select: {
            status: true,
            startedAt: true,
            completedAt: true,
            failureReason: true,
          },
          orderBy: { attemptNumber: 'asc' },
        },
      },
    });

    if (!shipment) throw new NotFoundException('No shipment found for that tracking number');

    return {
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      createdAt: shipment.createdAt,
      estimatedDeliveryAt: shipment.order?.estimatedDeliveryAt ?? null,
      origin: shipment.order?.pickupAddress ?? null,
      destination: shipment.order?.deliveryAddress ?? null,
      deliveryAttempts: shipment.deliveries,
    };
  }
}

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenancyContext } from '../../common/tenancy/tenancy-context';
import { CreateOrderDto } from './dto/create-order.dto';
import { AssignOrderDto } from './dto/assign-order.dto';
import { TransitionOrderDto } from './dto/transition-order.dto';
import { assertValidTransition } from './domain/order-state-machine';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyContext,
    private readonly events: EventEmitter2,
  ) {}

  async create(dto: CreateOrderDto) {
    const { companyId, userId } = this.tenancy.current;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          companyId,
          customerId: dto.customerId,
          pickupAddress: dto.pickupAddress as any,
          deliveryAddress: dto.deliveryAddress as any,
          packageInfo: dto.packageInfo as any,
          weightKg: dto.weightKg,
          deliveryFee: dto.deliveryFee,
          priority: dto.priority,
        },
      });

      await tx.shipment.create({
        data: {
          orderId: created.id,
          companyId,
          trackingNumber: generateTrackingNumber(),
          status: created.status,
        },
      });

      // Outbox write would go here in the same transaction in a full
      // implementation (see architecture doc §10). Emitting directly
      // for now — swap for outbox-polling once Milestone 8 lands.
      return created;
    });

    this.events.emit('order.created', { orderId: order.id, companyId, actorId: userId });
    return order;
  }

  async findAll(params: { page: number; pageSize: number; status?: string }) {
    const { companyId } = this.tenancy.current;
    const where = { companyId, deletedAt: null, ...(params.status ? { status: params.status as any } : {}) };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async findOne(id: string) {
    const { companyId } = this.tenancy.current;
    const order = await this.prisma.order.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   * Assigns a driver + vehicle to an order. Runs inside a serializable
   * transaction and re-checks availability at the DB level — this is
   * what prevents two dispatchers from double-booking the same driver
   * (see architecture doc §30, Concurrency).
   */
  async assign(orderId: string, dto: AssignOrderDto) {
    const { companyId, userId } = this.tenancy.current;

    const updated = await this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findFirst({ where: { id: orderId, companyId, deletedAt: null } });
        if (!order) throw new NotFoundException('Order not found');
        if (order.assignedDriverId) throw new ConflictException('Order already has an assigned driver');

        const driver = await tx.driver.findFirst({ where: { id: dto.driverId, companyId } });
        if (!driver) throw new NotFoundException('Driver not found');
        if (driver.availability !== 'AVAILABLE') {
          throw new ConflictException(`Driver is not available (status: ${driver.availability})`);
        }

        const vehicle = await tx.vehicle.findFirst({ where: { id: dto.vehicleId, companyId } });
        if (!vehicle) throw new NotFoundException('Vehicle not found');
        if (vehicle.status !== 'AVAILABLE') {
          throw new ConflictException(`Vehicle is not available (status: ${vehicle.status})`);
        }

        const [result] = await Promise.all([
          tx.order.update({
            where: { id: orderId },
            data: { assignedDriverId: dto.driverId, assignedVehicleId: dto.vehicleId },
          }),
          tx.driver.update({ where: { id: dto.driverId }, data: { availability: 'ON_DELIVERY' } }),
          tx.vehicle.update({ where: { id: dto.vehicleId }, data: { status: 'IN_USE' } }),
        ]);

        return result;
      },
      { isolationLevel: 'Serializable' },
    );

    this.events.emit('order.assigned', {
      orderId,
      companyId,
      actorId: userId,
      driverId: dto.driverId,
      vehicleId: dto.vehicleId,
    });

    return updated;
  }

  async transition(orderId: string, dto: TransitionOrderDto) {
    const { companyId, userId } = this.tenancy.current;

    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id: orderId, companyId, deletedAt: null } });
      if (!order) throw new NotFoundException('Order not found');

      // Throws InvalidOrderTransitionError (mapped to 422 by the filter)
      // if this move isn't in the allow-list — see domain/order-state-machine.ts
      assertValidTransition(order.status, dto.toStatus);

      const result = await tx.order.update({ where: { id: orderId }, data: { status: dto.toStatus } });

      // Keep the linked shipment's status mirrored — shipment is what
      // the public tracking page reads.
      await tx.shipment.update({ where: { orderId }, data: { status: dto.toStatus } }).catch(() => {
        // shipment may not exist yet in edge-case flows; non-fatal here
      });

      return result;
    });

    this.events.emit('order.status_changed', {
      orderId,
      companyId,
      actorId: userId,
      toStatus: dto.toStatus,
    });

    return updated;
  }
}

function generateTrackingNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FF-${year}-${random}`;
}

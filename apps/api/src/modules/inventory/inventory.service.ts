import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MovementType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async recordMovement(itemId: string, type: MovementType, quantity: number) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Inventory item not found');

    const delta = type === 'OUT' ? -quantity : quantity;
    const newQuantity = item.quantity + delta;

    const [movement, updated] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.create({ data: { itemId, type, quantity } }),
      this.prisma.inventoryItem.update({ where: { id: itemId }, data: { quantity: newQuantity } }),
    ]);

    if (updated.quantity <= updated.reorderThreshold) {
      this.events.emit('inventory.low_stock', { itemId, quantity: updated.quantity, threshold: updated.reorderThreshold });
    }

    return { movement, item: updated };
  }

  listByWarehouse(warehouseId: string) {
    return this.prisma.inventoryItem.findMany({ where: { warehouseId } });
  }
}

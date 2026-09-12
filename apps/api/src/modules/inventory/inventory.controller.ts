import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { MovementType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('warehouse/:warehouseId')
  @RequirePermission('inventory:read')
  listByWarehouse(@Param('warehouseId', ParseUUIDPipe) warehouseId: string) {
    return this.inventory.listByWarehouse(warehouseId);
  }

  @Post('movements')
  @RequirePermission('inventory:movement:create')
  recordMovement(@Body() dto: { itemId: string; type: MovementType; quantity: number }) {
    return this.inventory.recordMovement(dto.itemId, dto.type, dto.quantity);
  }
}

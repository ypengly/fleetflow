import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { WarehousesService } from './warehouses.service';

@Controller('warehouses')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class WarehousesController {
  constructor(private readonly warehouses: WarehousesService) {}

  @Get()
  @RequirePermission('warehouse:read')
  findAll() {
    return this.warehouses.findAll();
  }

  @Get(':id')
  @RequirePermission('warehouse:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehouses.findOne(id);
  }

  @Post()
  @RequirePermission('warehouse:create')
  create(@Body() dto: { name: string; address: Record<string, unknown>; capacity: number; managerId?: string }) {
    return this.warehouses.create(dto);
  }
}

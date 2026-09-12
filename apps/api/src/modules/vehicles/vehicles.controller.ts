import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get()
  @RequirePermission('vehicle:read')
  findAll() {
    return this.vehicles.findAll();
  }

  @Post()
  @RequirePermission('vehicle:create')
  create(@Body() dto: { licensePlate: string; type: string; capacityKg: number }) {
    return this.vehicles.create(dto);
  }
}

import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { DriverAvailability } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { DriversService } from './drivers.service';

@Controller('drivers')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  @Get()
  @RequirePermission('driver:read')
  findAll() {
    return this.drivers.findAll();
  }

  @Get(':id/performance')
  @RequirePermission('driver:performance:read')
  performance(@Param('id', ParseUUIDPipe) id: string) {
    return this.drivers.performance(id);
  }

  @Patch(':id/availability')
  @RequirePermission('driver:availability:update')
  setAvailability(@Param('id', ParseUUIDPipe) id: string, @Body('availability') availability: DriverAvailability) {
    return this.drivers.setAvailability(id, availability);
  }
}

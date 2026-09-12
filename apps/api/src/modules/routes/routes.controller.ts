import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { RoutesService } from './routes.service';

@Controller('routes')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RoutesController {
  constructor(private readonly routes: RoutesService) {}

  @Get()
  @RequirePermission('route:read')
  findAll() {
    return this.routes.findAll();
  }

  @Post(':id/optimize')
  @RequirePermission('route:optimize')
  optimize(@Param('id', ParseUUIDPipe) id: string, @Body() origin: { lat: number; lng: number }) {
    return this.routes.optimize(id, origin);
  }
}

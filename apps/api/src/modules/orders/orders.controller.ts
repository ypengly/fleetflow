import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AssignOrderDto } from './dto/assign-order.dto';
import { TransitionOrderDto } from './dto/transition-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @RequirePermission('order:create')
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Get()
  @RequirePermission('order:read')
  findAll(@Query('page') page = '1', @Query('pageSize') pageSize = '20', @Query('status') status?: string) {
    return this.orders.findAll({ page: Number(page), pageSize: Number(pageSize), status });
  }

  @Get(':id')
  @RequirePermission('order:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.findOne(id);
  }

  @Post(':id/assign')
  @RequirePermission('order:assign')
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignOrderDto) {
    return this.orders.assign(id, dto);
  }

  @Post(':id/transition')
  @RequirePermission('order:transition')
  transition(@Param('id', ParseUUIDPipe) id: string, @Body() dto: TransitionOrderDto) {
    return this.orders.transition(id, dto);
  }
}

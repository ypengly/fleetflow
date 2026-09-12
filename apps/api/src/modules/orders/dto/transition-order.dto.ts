import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class TransitionOrderDto {
  @IsEnum(OrderStatus)
  toStatus: OrderStatus;
}

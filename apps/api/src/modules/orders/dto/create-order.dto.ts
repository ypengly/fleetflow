import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsObject, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Priority } from '@prisma/client';

class AddressDto {
  @IsString()
  line1: string;

  @IsString()
  city: string;

  @IsString()
  country: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class CreateOrderDto {
  @IsUUID()
  customerId: string;

  @ValidateNested()
  @Type(() => AddressDto)
  pickupAddress: AddressDto;

  @ValidateNested()
  @Type(() => AddressDto)
  deliveryAddress: AddressDto;

  @IsObject()
  packageInfo: Record<string, unknown>;

  @IsNumber()
  @Min(0.01)
  weightKg: number;

  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @IsEnum(Priority)
  priority: Priority;
}

import { Controller, Get, Param } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipments: ShipmentsService) {}

  // Intentionally NOT behind JwtAuthGuard — this is the public tracking
  // endpoint. Rate-limited separately (stricter bucket) at the gateway
  // layer to prevent tracking-number enumeration (architecture doc §13).
  @Get(':trackingNumber')
  track(@Param('trackingNumber') trackingNumber: string) {
    return this.shipments.trackByNumber(trackingNumber);
  }
}

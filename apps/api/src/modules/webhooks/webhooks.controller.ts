import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenancyContext } from '../../common/tenancy/tenancy-context';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class WebhooksController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyContext,
  ) {}

  @Get()
  @RequirePermission('webhook:read')
  list() {
    return this.prisma.webhook.findMany({ where: { companyId: this.tenancy.companyId } });
  }

  @Post()
  @RequirePermission('webhook:create')
  create(@Body() dto: { url: string; events: string[] }) {
    return this.prisma.webhook.create({
      data: {
        companyId: this.tenancy.companyId,
        url: dto.url,
        events: dto.events,
        secret: randomBytes(32).toString('hex'),
      },
    });
  }
}

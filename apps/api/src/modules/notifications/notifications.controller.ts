import { Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenancyContext } from '../../common/tenancy/tenancy-context';
import { PrismaService } from '../../common/prisma/prisma.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyContext,
  ) {}

  @Get()
  list() {
    return this.prisma.notification.findMany({
      where: { companyId: this.tenancy.companyId, userId: this.tenancy.current.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Patch(':id/read')
  markRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
}

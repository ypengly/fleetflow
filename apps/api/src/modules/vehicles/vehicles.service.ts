import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenancyContext } from '../../common/tenancy/tenancy-context';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyContext,
  ) {}

  findAll() {
    return this.prisma.vehicle.findMany({ where: { companyId: this.tenancy.companyId, deletedAt: null } });
  }

  create(data: { licensePlate: string; type: string; capacityKg: number }) {
    return this.prisma.vehicle.create({
      data: { ...data, companyId: this.tenancy.companyId },
    });
  }
}

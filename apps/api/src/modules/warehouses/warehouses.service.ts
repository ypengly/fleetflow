import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenancyContext } from '../../common/tenancy/tenancy-context';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyContext,
  ) {}

  findAll() {
    return this.prisma.warehouse.findMany({
      where: { companyId: this.tenancy.companyId, deletedAt: null },
      include: { inventory: true },
    });
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, companyId: this.tenancy.companyId, deletedAt: null },
      include: { inventory: true },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  create(data: { name: string; address: Record<string, unknown>; capacity: number; managerId?: string }) {
    return this.prisma.warehouse.create({ data: { ...data, address: data.address as any, companyId: this.tenancy.companyId } });
  }
}

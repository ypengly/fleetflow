import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TenancyContext } from '../../common/tenancy/tenancy-context';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenancy: TenancyContext,
  ) {}

  async getCurrent() {
    const company = await this.prisma.company.findUnique({ where: { id: this.tenancy.companyId } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async listMembers() {
    return this.prisma.companyMember.findMany({
      where: { companyId: this.tenancy.companyId },
      include: { user: { select: { id: true, name: true, email: true } }, role: true },
    });
  }
}

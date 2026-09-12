import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with that email already exists');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const result = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: dto.companyName, slug: slugify(dto.companyName) },
      });

      const adminRole = await tx.role.upsert({
        where: { name: 'COMPANY_ADMIN' },
        update: {},
        create: { name: 'COMPANY_ADMIN' },
      });

      const user = await tx.user.create({
        data: { email: dto.email, name: dto.name, passwordHash },
      });

      await tx.companyMember.create({
        data: { companyId: company.id, userId: user.id, roleId: adminRole.id },
      });

      return { company, user, roleName: adminRole.name };
    });

    return this.issueTokens(result.user.id, result.company.id, result.roleName);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { memberships: { include: { role: true } } },
    });

    if (!user?.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // A user could belong to multiple companies (rare, e.g. SUPER_ADMIN);
    // default to their first membership. The dashboard can offer a
    // company switcher later if that becomes a real need.
    const membership = user.memberships[0];
    if (!membership) throw new UnauthorizedException('No company membership found for this user');

    return this.issueTokens(user.id, membership.companyId, membership.role.name);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify<{ sub: string; companyId: string; roleName: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      return this.issueTokens(payload.sub, payload.companyId, payload.roleName);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async issueTokens(userId: string, companyId: string, roleName: string) {
    const permissions = await this.permissionsForRole(roleName);

    const accessToken = this.jwt.sign(
      { sub: userId, companyId, roleName, permissions },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_TTL ?? '15m' },
    );

    const refreshToken = this.jwt.sign(
      { sub: userId, companyId, roleName },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: process.env.JWT_REFRESH_TTL ?? '7d' },
    );

    return { accessToken, refreshToken };
  }

  private async permissionsForRole(roleName: string): Promise<string[]> {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
      include: { permissions: { include: { permission: true } } },
    });
    return role?.permissions.map((rp) => rp.permission.key) ?? [];
  }
}

function slugify(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

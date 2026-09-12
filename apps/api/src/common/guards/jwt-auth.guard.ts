import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TenancyContext } from '../tenancy/tenancy-context';

interface AccessTokenPayload {
  sub: string; // userId
  companyId: string;
  roleName: string;
  permissions: string[];
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly tenancy: TenancyContext,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = header.slice('Bearer '.length);

    try {
      const payload = this.jwt.verify<AccessTokenPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      this.tenancy.set({
        userId: payload.sub,
        companyId: payload.companyId,
        roleName: payload.roleName,
        permissions: payload.permissions,
      });

      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

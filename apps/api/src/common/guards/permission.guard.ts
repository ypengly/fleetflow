import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { TenancyContext } from '../tenancy/tenancy-context';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenancy: TenancyContext,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.get<string | undefined>(PERMISSION_KEY, context.getHandler());

    // No @RequirePermission() on this route means "authenticated is enough" —
    // JwtAuthGuard (which runs first) already enforced that.
    if (!requiredPermission) return true;

    const { permissions } = this.tenancy.current;

    if (!permissions.includes(requiredPermission)) {
      throw new ForbiddenException(`Missing required permission: ${requiredPermission}`);
    }

    return true;
  }
}

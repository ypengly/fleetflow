import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'required_permission';

/**
 * Marks a controller method as requiring a specific permission key
 * (e.g. "order:assign"). Enforced by PermissionGuard, which checks the
 * caller's actual role/permission set from the DB-backed JWT claims —
 * never trusts anything the client sends about its own role.
 */
export const RequirePermission = (permissionKey: string) => SetMetadata(PERMISSION_KEY, permissionKey);

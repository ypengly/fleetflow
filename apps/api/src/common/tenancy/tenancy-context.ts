import { Injectable, Scope } from '@nestjs/common';

export interface AuthenticatedUser {
  userId: string;
  companyId: string;
  roleName: string;
  permissions: string[];
}

/**
 * Request-scoped holder for "who is making this request, and which
 * company are they acting as". Populated once by JwtAuthGuard and read
 * everywhere downstream (repositories, services, guards) so tenant
 * scoping never depends on each service remembering to filter by
 * companyId manually.
 */
@Injectable({ scope: Scope.REQUEST })
export class TenancyContext {
  private user: AuthenticatedUser | null = null;

  set(user: AuthenticatedUser) {
    this.user = user;
  }

  get current(): AuthenticatedUser {
    if (!this.user) {
      throw new Error('TenancyContext accessed before authentication ran');
    }
    return this.user;
  }

  get companyId(): string {
    return this.current.companyId;
  }
}

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Runs `fn` inside a transaction with the Postgres session variable
   * `app.current_company_id` set for the duration of the transaction.
   * This backs the Row-Level Security policies (see prisma/rls.sql) —
   * a second, DB-level layer of tenant isolation on top of the
   * application-level scoping done in TenantScopedRepository.
   */
  async withTenant<T>(companyId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_company_id = '${companyId}'`);
      return fn(tx as unknown as PrismaClient);
    });
  }
}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { RoutesModule } from './modules/routes/routes.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    OrdersModule,
    ShipmentsModule,
    DriversModule,
    VehiclesModule,
    RoutesModule,
    WarehousesModule,
    InventoryModule,
    TrackingModule,
    NotificationsModule,
    WebhooksModule,
    AnalyticsModule,
    AuditModule,
  ],
})
export class AppModule {}

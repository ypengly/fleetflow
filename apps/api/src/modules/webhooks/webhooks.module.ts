import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhooksProcessor } from './webhooks.processor';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, BullModule.registerQueue({ name: 'webhooks' })],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhooksProcessor],
})
export class WebhooksModule {}

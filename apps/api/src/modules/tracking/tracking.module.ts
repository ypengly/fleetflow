import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TrackingGateway } from './tracking.gateway';
import { LocationBufferService } from './location-buffer.service';
import { LocationPersistJob } from './location-persist.job';

@Module({
  imports: [JwtModule.register({}), ScheduleModule.forRoot()],
  providers: [TrackingGateway, LocationBufferService, LocationPersistJob],
})
export class TrackingModule {}

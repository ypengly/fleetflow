import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TenancyContext } from '../../common/tenancy/tenancy-context';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, TenancyContext, JwtAuthGuard, PermissionGuard],
  exports: [TenancyContext, JwtAuthGuard, PermissionGuard],
})
export class AuthModule {}

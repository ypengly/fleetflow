import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompaniesService } from './companies.service';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get('me')
  getCurrent() {
    return this.companies.getCurrent();
  }

  @Get('me/members')
  listMembers() {
    return this.companies.listMembers();
  }
}

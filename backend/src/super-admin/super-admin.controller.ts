import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { SuperAdminService, AdminOrgItem } from './super-admin.service';

@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('stats')
  async getStats() {
    return this.superAdminService.getSuperAdminStats();
  }

  @Get('admins')
  async getAdminOrgs() {
    return this.superAdminService.getAdminOrgs();
  }

  @Post('admins')
  async createAdminOrg(@Body() dto: Partial<AdminOrgItem>) {
    return this.superAdminService.createAdminOrg(dto);
  }

  @Patch('admins/:id')
  async updateAdminOrg(
    @Param('id') id: string,
    @Body() dto: Partial<AdminOrgItem>,
  ) {
    return this.superAdminService.updateAdminOrg(id, dto);
  }

  @Patch('admins/:id/status')
  async toggleAdminStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'SUSPENDED',
  ) {
    return this.superAdminService.toggleAdminOrgStatus(id, status);
  }

  @Delete('admins/:id')
  async deleteAdminOrg(@Param('id') id: string) {
    return this.superAdminService.deleteAdminOrg(id);
  }
}

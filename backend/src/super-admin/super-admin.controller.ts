import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Put,
  Request,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminStatusDto } from './dto/update-admin-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, AdminRole } from '../common/decorators/roles.decorator';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Post('admins')
  @Roles(AdminRole.SUPER_ADMIN)
  async createAdmin(@Request() req: any, @Body() dto: CreateAdminDto) {
    const creatorId = req.user?.id || req.user?.sub || 1;
    return this.superAdminService.createAdmin(dto, creatorId);
  }

  @Get('admins')
  @Roles(AdminRole.SUPER_ADMIN)
  async getAdmins(@Query('status') status?: string) {
    const statusNum = status ? parseInt(status, 10) : undefined;
    return this.superAdminService.getAdmins(statusNum);
  }

  @Put('admins/:id/status')
  @Roles(AdminRole.SUPER_ADMIN)
  async updateAdminStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminStatusDto,
  ) {
    return this.superAdminService.updateAdminStatus(id, dto.is_active);
  }

  @Delete('admins/:id')
  @Roles(AdminRole.SUPER_ADMIN)
  async deleteAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.superAdminService.deleteAdmin(id);
  }

  @Get('stats')
  @Roles(AdminRole.SUPER_ADMIN)
  async getStats() {
    return this.superAdminService.getSuperAdminStats();
  }
}

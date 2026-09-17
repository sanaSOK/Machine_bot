import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { AssignBranchDto, AssignAdminDto, AssignPairDto } from './dto/assign-branch.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, AdminRole } from '../common/decorators/roles.decorator';

@Controller(['super-admin/branches', 'branches'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @Roles(AdminRole.SUPER_ADMIN)
  async getBranches() {
    return this.branchesService.getBranches();
  }

  @Post()
  @Roles(AdminRole.SUPER_ADMIN)
  async createBranch(@Request() req: any, @Body() dto: CreateBranchDto) {
    const creatorId = req.user?.id || req.user?.sub || 1;
    return this.branchesService.createBranch(dto, creatorId);
  }

  @Put('assign')
  @Roles(AdminRole.SUPER_ADMIN)
  async assignPair(@Body() dto: AssignPairDto) {
    return this.branchesService.assignBranch(dto.admin_id, dto.branch_id);
  }

  @Put(':id')
  @Roles(AdminRole.SUPER_ADMIN)
  async updateBranch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.updateBranch(id, dto);
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN)
  async deleteBranch(@Param('id', ParseIntPipe) id: number) {
    return this.branchesService.deleteBranch(id);
  }

  @Put(':id/assign-admin')
  @Roles(AdminRole.SUPER_ADMIN)
  async assignAdmin(
    @Param('id', ParseIntPipe) branchId: number,
    @Body() dto: AssignAdminDto,
  ) {
    return this.branchesService.assignBranch(dto.admin_id, branchId);
  }

  @Put(':id/assign-branch')
  @Roles(AdminRole.SUPER_ADMIN)
  async assignBranch(
    @Param('id', ParseIntPipe) adminId: number,
    @Body() dto: AssignBranchDto,
  ) {
    return this.branchesService.assignBranch(adminId, dto.branch_id);
  }
}

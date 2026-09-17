import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  Header,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { SettingsService, SystemSettings } from './settings.service';
import { ReportsService } from './reports.service';
import { DepartmentsService } from '../departments/departments.service';
import { CreateDepartmentDto } from '../departments/dto/create-department.dto';
import { UpdateDepartmentDto } from '../departments/dto/update-department.dto';
import {
  BranchQueryDto,
  AdminAttendanceQueryDto,
  AdminEmployeeQueryDto,
  UpdateUserDto,
  UpdateRoleDto,
  ToggleStatusDto,
} from './dto';
import { logoMulterOptions } from '../common/multer';
import { Roles, AdminRole } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ParseIntOptionalPipe } from '../common/pipes/parse-int-optional.pipe';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly settingsService: SettingsService,
    private readonly reportsService: ReportsService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  @Get('stats')
  async getStats(
    @Request() req: any,
    @Query() query: BranchQueryDto,
  ) {
    return this.adminService.getStats(req.user, query.branch_id);
  }

//  settings
  @Get('settings')
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Put('settings')
  updateSettings(@Body() dto: Partial<SystemSettings>) {
    return this.settingsService.updateSettings(dto);
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('logo', logoMulterOptions))
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No logo file provided');
    }
    return this.settingsService.updateLogo(file);
  }

// departments
  @Get('departments')
  async getDepartments(
    @Request() req: any,
    @Query() query: BranchQueryDto,
  ) {
    return this.departmentsService.getDepartments(req.user, query.branch_id);
  }

  @Post('departments')
  async createDepartment(@Request() req: any, @Body() dto: CreateDepartmentDto) {
    return this.departmentsService.createDepartment(req.user, dto);
  }

  @Put('departments/:id')
  async updateDepartment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.updateDepartment(req.user, id, dto);
  }

  @Delete('departments/:id')
  async deleteDepartment(@Request() req: any, @Param('id') id: string) {
    return this.departmentsService.deleteDepartment(req.user, id);
  }


  // stafts
  @Get('employees')
  async getEmployees(
    @Request() req: any,
    @Query() query: AdminEmployeeQueryDto,
  ) {
    return this.adminService.getEmployees(
      req.user,
      query,
      query.branch_id,
    );
  }

  @Get('users/:id/details')
  async getUserDetails(
    @Request() req: any,
    @Param('id', ParseIntOptionalPipe) id: number,
  ) {
    return this.adminService.getUserDetails(id, req.user);
  }

  @Put('users/:id/role')
  async updateUserRole(
    @Request() req: any,
    @Param('id', ParseIntOptionalPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.adminService.updateUserRole(id, dto.role, req.user);
  }

  @Patch('users/:id/status')
  async toggleUserStatus(
    @Request() req: any,
    @Param('id', ParseIntOptionalPipe) id: number,
    @Body() dto: ToggleStatusDto,
  ) {
    return this.adminService.toggleUserStatus(id, dto.is_active, req.user);
  }

  @Patch('users/:id')
  async updateUser(
    @Request() req: any,
    @Param('id', ParseIntOptionalPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto, req.user);
  }

  @Delete('users/:id')
  async deleteUser(
    @Request() req: any,
    @Param('id', ParseIntOptionalPipe) id: number,
  ) {
    return this.adminService.deleteUser(id, req.user);
  }


  // attendance logs
  @Get('attendance')
  async getAttendance(
    @Request() req: any,
    @Query() query: AdminAttendanceQueryDto,
  ) {
    return this.adminService.getAttendanceLogs(
      req.user,
      query,
      query.branch_id,
    );
  }



  // Reports
  @Get('export')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="eroxii_attendance_report.xlsx"')
  async exportExcel(@Request() req: any, @Res() res: Response) {
    const buffer = await this.reportsService.exportExcel(req.user);
    return res.send(buffer);
  }

  @Post('trigger-daily-summary')
  async triggerDailySummaryPost() {
    const success = await this.reportsService.sendDailySummaryReport();
    return { success, message: success ? 'Daily Summary Digest sent to Telegram' : 'Failed to send Daily Summary Digest' };
  }

  @Get('trigger-daily-summary')
  async triggerDailySummaryGet() {
    const success = await this.reportsService.sendDailySummaryReport();
    return { success, message: success ? 'Daily Summary Digest sent to Telegram' : 'Failed to send Daily Summary Digest' };
  }
}

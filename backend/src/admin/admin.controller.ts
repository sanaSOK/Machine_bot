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
import { AdminService, AdminAttendanceQueryDto, AdminEmployeeQueryDto } from './admin.service';
import { SettingsService, SystemSettings } from './settings.service';
import { ReportsService } from './reports.service';
import { DepartmentsService } from '../departments/departments.service';
import { CreateDepartmentDto } from '../departments/dto/create-department.dto';
import { UpdateDepartmentDto } from '../departments/dto/update-department.dto';
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
    @Query('branch_id', ParseIntOptionalPipe) branchId?: number,
  ) {
    return this.adminService.getStats(req.user, branchId);
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
    @Query('branch_id', ParseIntOptionalPipe) branchId?: number,
  ) {
    return this.departmentsService.getDepartments(req.user, branchId);
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
    @Query('search') search?: string,
    @Query('department') department?: string,
    @Query('role') role?: string,
    @Query('limit', ParseIntOptionalPipe) limit?: number,
    @Query('offset', ParseIntOptionalPipe) offset?: number,
    @Query('branch_id', ParseIntOptionalPipe) branchId?: number,
  ) {
    return this.adminService.getEmployees(
      req.user,
      { search, department, role, limit, offset } satisfies AdminEmployeeQueryDto,
      branchId,
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
    @Body('role') role: string,
  ) {
    return this.adminService.updateUserRole(id, role, req.user);
  }

  @Patch('users/:id/status')
  async toggleUserStatus(
    @Request() req: any,
    @Param('id', ParseIntOptionalPipe) id: number,
    @Body('is_active') is_active: boolean,
  ) {
    return this.adminService.toggleUserStatus(id, is_active, req.user);
  }

  @Patch('users/:id')
  async updateUser(
    @Request() req: any,
    @Param('id', ParseIntOptionalPipe) id: number,
    @Body() dto: {
      first_name?: string;
      last_name?: string;
      username?: string;
      role?: string;
      address?: string;
      is_active?: boolean;
      branch_id?: number;
    },
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
    @Query('search') search?: string,
    @Query('type') type?: 'CHECK_IN' | 'CHECK_OUT',
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('limit', ParseIntOptionalPipe) limit?: number,
    @Query('offset', ParseIntOptionalPipe) offset?: number,
    @Query('branch_id', ParseIntOptionalPipe) branchId?: number,
  ) {
    return this.adminService.getAttendanceLogs(
      req.user,
      { search, type, date, status, limit: limit ?? 50, offset: offset ?? 0 } satisfies AdminAttendanceQueryDto,
      branchId,
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

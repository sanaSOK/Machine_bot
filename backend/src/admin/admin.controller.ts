import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Res,
  Header,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { AdminService, SystemSettings } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Post('settings')
  async updateSettings(@Body() dto: Partial<SystemSettings>) {
    return this.adminService.updateSettings(dto);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    return this.adminService.updateUserRole(parseInt(id, 10), role);
  }

  @Post('logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const fileExtName = extname(file.originalname) || '.png';
          cb(null, `company_logo${fileExtName}`);
        },
      }),
    }),
  )
  async uploadLogo(@UploadedFile() file: any) {
    if (!file) {
      return { error: 'No logo file provided' };
    }
    const logoUrl = `/uploads/${file.filename}?v=${Date.now()}`;
    this.adminService.updateSettings({ logoUrl });

    try {
      const publicPath = join(process.cwd(), '..', 'frontend', 'public', 'logo.png');
      const publicDir = join(process.cwd(), '..', 'frontend', 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.copyFileSync(file.path, publicPath);
    } catch (e) {
      console.warn('Copy logo to frontend/public warning:', e);
    }

    return { logoUrl, message: 'Company logo uploaded and updated successfully' };
  }

  @Get('attendance')
  async getAttendance(
    @Query('search') search?: string,
    @Query('type') type?: 'CHECK_IN' | 'CHECK_OUT',
    @Query('date') date?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.getAttendanceLogs({
      search,
      type,
      date,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('employees')
  async getEmployees(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.getEmployees({
      search,
      limit: limit ? parseInt(limit, 10) : 10,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('export')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="eroxii_attendance_report.xlsx"')
  async exportExcel(@Res() res: Response) {
    const buffer = await this.adminService.exportExcel();
    return res.send(buffer);
  }
}

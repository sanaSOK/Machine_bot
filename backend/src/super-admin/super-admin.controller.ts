import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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

  @Post('admins/upload-logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const fileExtName = extname(file.originalname) || '.png';
          cb(null, `org_logo_${Date.now()}${fileExtName}`);
        },
      }),
    }),
  )
  async uploadOrgLogo(@UploadedFile() file: any) {
    if (!file) {
      return { error: 'No image file provided' };
    }
    const logoUrl = `/uploads/${file.filename}?v=${Date.now()}`;
    return { logoUrl, message: 'Organization logo image uploaded successfully' };
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

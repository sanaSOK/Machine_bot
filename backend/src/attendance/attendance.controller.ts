import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';

const imageFileFilter = (req: any, file: Express.Multer.File, callback: any) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new BadRequestException('Only JPEG, PNG, and WebP image files are allowed'),
      false,
    );
  }
  callback(null, true);
};

const storageConfig = diskStorage({
  destination: (req: any, file: Express.Multer.File, cb) => {
    const user = req.user;
    // Prefer Telegram username (e.g. "superappbot"), or fallback to telegram_user_id (e.g. "639544003") or user_id
    const rawUsername = user?.username || user?.telegram_user_id || `user_${user?.id || 'unknown'}`;
    // Sanitize folder name for filesystem compatibility
    const userFolder = rawUsername.replace(/[^a-zA-Z0-9_-]/g, '_');

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Subfolder path: uploads/attendance/<userFolder>/YYYY/MM
    const uploadPath = path.join(process.cwd(), 'uploads', 'attendance', userFolder, year, month);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `photo-${uniqueSuffix}${ext}`);
  },
});

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('today')
  async getTodayStatus(@CurrentUser() user: User) {
    return this.attendanceService.getTodayStatus(user.id);
  }

  @Get('history')
  async getHistory(@CurrentUser() user: User) {
    return this.attendanceService.getHistory(user.id);
  }

  @Post('check-in')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: storageConfig,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  async checkIn(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CheckInDto,
  ) {
    return this.attendanceService.checkIn(user, file, dto);
  }

  @Post('check-out')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: storageConfig,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  async checkOut(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CheckOutDto,
  ) {
    return this.attendanceService.checkOut(user, file, dto);
  }
}

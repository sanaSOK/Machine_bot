import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance, AttendanceAction } from './attendance.entity';
import { User } from '../users/user.entity';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';

export interface TodayStatusResponse {
  checkIn: Attendance | null;
  checkOut: Attendance | null;
  status: 'NOT_CHECKED_IN' | 'WORKING' | 'COMPLETED';
  canCheckIn: boolean;
  canCheckOut: boolean;
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  async getTodayStatus(userId: number): Promise<TodayStatusResponse> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todayRecords = await this.attendanceRepository.find({
      where: {
        user_id: userId,
        created_at: Between(startOfDay, endOfDay),
      },
      order: {
        created_at: 'ASC',
      },
    });

    const checkInRecord = todayRecords.find((r) => r.action === AttendanceAction.CHECK_IN) || null;
    const checkOutRecord = [...todayRecords].reverse().find((r) => r.action === AttendanceAction.CHECK_OUT) || null;

    let status: 'NOT_CHECKED_IN' | 'WORKING' | 'COMPLETED' = 'NOT_CHECKED_IN';
    let canCheckIn = true;
    let canCheckOut = false;

    if (todayRecords.length > 0) {
      const lastRecord = todayRecords[todayRecords.length - 1];
      if (lastRecord.action === AttendanceAction.CHECK_IN) {
        status = 'WORKING';
        canCheckIn = false;
        canCheckOut = true;
      } else if (lastRecord.action === AttendanceAction.CHECK_OUT) {
        status = 'COMPLETED';
        canCheckIn = true; // allow new cycle if needed or 1 check-in per day
        canCheckOut = false;
      }
    }

    return {
      checkIn: checkInRecord,
      checkOut: checkOutRecord,
      status,
      canCheckIn,
      canCheckOut,
    };
  }

  async checkIn(
    user: User,
    file: Express.Multer.File | undefined,
    dto: CheckInDto,
  ): Promise<Attendance> {
    if (!file) {
      throw new BadRequestException('Attendance photo is required for check in');
    }

    const todayStatus = await this.getTodayStatus(user.id);
    if (!todayStatus.canCheckIn) {
      throw new BadRequestException('Already checked in. You must check out before checking in again.');
    }

    const photoUrl = this.formatFileUrl(file);

    const attendance = this.attendanceRepository.create({
      user_id: user.id,
      user,
      action: AttendanceAction.CHECK_IN,
      photo_url: photoUrl,
      latitude: dto.latitude !== undefined ? dto.latitude : null,
      longitude: dto.longitude !== undefined ? dto.longitude : null,
    });

    return this.attendanceRepository.save(attendance);
  }

  async checkOut(
    user: User,
    file: Express.Multer.File | undefined,
    dto: CheckOutDto,
  ): Promise<Attendance> {
    if (!file) {
      throw new BadRequestException('Attendance photo is required for check out');
    }

    const todayStatus = await this.getTodayStatus(user.id);
    if (!todayStatus.canCheckOut) {
      throw new BadRequestException('Cannot check out: You are not currently checked in.');
    }

    const photoUrl = this.formatFileUrl(file);

    const attendance = this.attendanceRepository.create({
      user_id: user.id,
      user,
      action: AttendanceAction.CHECK_OUT,
      photo_url: photoUrl,
      latitude: dto.latitude !== undefined ? dto.latitude : null,
      longitude: dto.longitude !== undefined ? dto.longitude : null,
    });

    return this.attendanceRepository.save(attendance);
  }

  async getHistory(userId: number): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  private formatFileUrl(file: Express.Multer.File): string {
    // Normalizing file path stored to relative URL format: /uploads/attendance/...
    const normalizedPath = file.path.replace(/\\/g, '/');
    const uploadIndex = normalizedPath.indexOf('uploads/');
    if (uploadIndex !== -1) {
      return '/' + normalizedPath.substring(uploadIndex);
    }
    return `/uploads/attendance/${file.filename}`;
  }
}

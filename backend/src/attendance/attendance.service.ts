import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance, AttendanceAction } from './attendance.entity';
import { User } from '../users/user.entity';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { TelegramService } from '../telegram/telegram.service';
import { AdminService } from '../admin/admin.service';

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly telegramService: TelegramService,
    private readonly adminService: AdminService,
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

    // Fetch the LATEST Check-In record for today
    const checkInRecord = [...todayRecords].reverse().find((r) => r.action === AttendanceAction.CHECK_IN) || null;
    let checkOutRecord = [...todayRecords].reverse().find((r) => r.action === AttendanceAction.CHECK_OUT) || null;

    let status: 'NOT_CHECKED_IN' | 'WORKING' | 'COMPLETED' = 'NOT_CHECKED_IN';
    let canCheckIn = true;
    let canCheckOut = false;

    if (todayRecords.length > 0) {
      const lastRecord = todayRecords[todayRecords.length - 1];
      if (lastRecord.action === AttendanceAction.CHECK_IN) {
        status = 'WORKING';
        canCheckIn = true; // Allow re-checking in to update to current live time
        canCheckOut = true;
        checkOutRecord = null; // While currently working/checked-in, hide previous session check-out time
      } else if (lastRecord.action === AttendanceAction.CHECK_OUT) {
        status = 'COMPLETED';
        canCheckIn = true; // Allow new check-in session
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

    const photoUrl = this.formatFileUrl(file);

    // Update user address if provided
    if (dto.address && user) {
      user.address = dto.address;
      await this.userRepository.save(user);
    }

    // Save Check-In record with current exact timestamp
    const attendance = this.attendanceRepository.create({
      user_id: user.id,
      user,
      action: AttendanceAction.CHECK_IN,
      photo_url: photoUrl,
      latitude: dto.latitude !== undefined ? dto.latitude : null,
      longitude: dto.longitude !== undefined ? dto.longitude : null,
      address: dto.address || null,
      created_at: new Date(), // Current Live Exact Timestamp
    });

    const saved = await this.attendanceRepository.save(attendance);

    // Send Telegram Photo Notification Alert
    this.sendTelegramCheckInNotification(user, file.path, saved).catch((e) =>
      console.warn('Failed to send Telegram check-in notification:', e),
    );

    return saved;
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

    if (dto.address && user) {
      user.address = dto.address;
      await this.userRepository.save(user);
    }

    // Save Check-Out record with current exact timestamp
    const attendance = this.attendanceRepository.create({
      user_id: user.id,
      user,
      action: AttendanceAction.CHECK_OUT,
      photo_url: photoUrl,
      latitude: dto.latitude !== undefined ? dto.latitude : null,
      longitude: dto.longitude !== undefined ? dto.longitude : null,
      address: dto.address || null,
      created_at: new Date(), // Current Live Exact Timestamp
    });

    const saved = await this.attendanceRepository.save(attendance);

    // Send Telegram Photo Notification Alert
    this.sendTelegramCheckOutNotification(user, file.path, saved).catch((e) =>
      console.warn('Failed to send Telegram check-out notification:', e),
    );

    return saved;
  }

  private async sendTelegramCheckInNotification(
    user: User,
    filePath: string,
    attendance: Attendance,
  ) {
    if (!user.telegram_user_id) return;

    const settings = this.adminService.getSettings();
    const now = new Date(attendance.created_at);
    const finalTimeStr = now.toLocaleTimeString('en-GB', { hour12: false });

    const [startHour, startMin] = (settings.workStartTime || '08:00').split(':').map(Number);
    const workStartMins = (startHour || 8) * 60 + (startMin || 0);
    const maxOnTimeMins = workStartMins + (settings.gracePeriodMinutes ?? 15);

    const checkInMins = now.getHours() * 60 + now.getMinutes();

    let status = 'ON_TIME';
    let lateText = '';
    if (checkInMins > maxOnTimeMins) {
      const lateMins = checkInMins - maxOnTimeMins;
      status = 'LATE';
      lateText = `📍 <b>Late: ${lateMins} min</b>\n`;
    }

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Employee';
    const empId = `EMP${String(user.id).padStart(3, '0')}`;
    const department = user.role || 'Electrical';

    let gpsText = '📍 <b>GPS:</b> N/A\n';
    let mapsText = '';
    if (attendance.latitude != null && attendance.longitude != null) {
      const lat = Number(attendance.latitude);
      const lng = Number(attendance.longitude);
      gpsText = `📍 <b>GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}</b>\n`;
      mapsText = `🗺️ <b>Google Maps:</b> https://www.google.com/maps?q=${lat},${lng}\n`;
    }

    const caption =
      `⚠️ <b>ATTENDANCE ALERT</b>\n\n` +
      `✅ <b>CHECK IN SUCCESS</b>\n\n` +
      `👤 <b>${fullName}</b>\n` +
      `🆔 <b>${empId}</b>\n` +
      `🏢 <b>${department}</b>\n` +
      `📋 <b>Status: ${status}</b>\n` +
      `📷 <b>Rear: ${finalTimeStr}</b>\n` +
      `🤳 <b>Selfie: ${finalTimeStr}</b>\n` +
      `⏱️ <b>Final: ${finalTimeStr}</b>\n` +
      lateText +
      gpsText +
      mapsText;

    // Send photo directly to Telegram user chat
    if (user.telegram_user_id) {
      await this.telegramService.sendAttendancePhotoNotification(user.telegram_user_id, filePath, caption);
    }

    // Send copy to Admin Group / Channel / Manager Chat ID if configured
    const adminChatId = settings.telegramNotificationChatId || process.env.TELEGRAM_NOTIFICATION_CHAT_ID;
    if (adminChatId && String(adminChatId) !== String(user.telegram_user_id)) {
      await this.telegramService.sendAttendancePhotoNotification(adminChatId, filePath, caption);
    }
  }

  private async sendTelegramCheckOutNotification(
    user: User,
    filePath: string,
    attendance: Attendance,
  ) {
    const settings = this.adminService.getSettings();
    const now = new Date(attendance.created_at);
    const finalTimeStr = now.toLocaleTimeString('en-GB', { hour12: false });

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Employee';
    const empId = `EMP${String(user.id).padStart(3, '0')}`;
    const department = user.role || 'Electrical';

    let gpsText = '📍 <b>GPS:</b> N/A\n';
    let mapsText = '';
    if (attendance.latitude != null && attendance.longitude != null) {
      const lat = Number(attendance.latitude);
      const lng = Number(attendance.longitude);
      gpsText = `📍 <b>GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}</b>\n`;
      mapsText = `🗺️ <b>Google Maps:</b> https://www.google.com/maps?q=${lat},${lng}\n`;
    }

    const caption =
      `⚠️ <b>ATTENDANCE ALERT</b>\n\n` +
      `🚪 <b>CHECK OUT SUCCESS</b>\n\n` +
      `👤 <b>${fullName}</b>\n` +
      `🆔 <b>${empId}</b>\n` +
      `🏢 <b>${department}</b>\n` +
      `📋 <b>Status: CHECK OUT</b>\n` +
      `📷 <b>Rear: ${finalTimeStr}</b>\n` +
      `🤳 <b>Selfie: ${finalTimeStr}</b>\n` +
      `⏱️ <b>Final: ${finalTimeStr}</b>\n` +
      gpsText +
      mapsText;

    // Send photo directly to Telegram user chat
    if (user.telegram_user_id) {
      await this.telegramService.sendAttendancePhotoNotification(user.telegram_user_id, filePath, caption);
    }

    // Send copy to Admin Group / Channel / Manager Chat ID if configured
    const adminChatId = settings.telegramNotificationChatId || process.env.TELEGRAM_NOTIFICATION_CHAT_ID;
    if (adminChatId && String(adminChatId) !== String(user.telegram_user_id)) {
      await this.telegramService.sendAttendancePhotoNotification(adminChatId, filePath, caption);
    }
  }

  async getHistory(userId: number): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  private formatFileUrl(file: Express.Multer.File): string {
    const normalizedPath = file.path.replace(/\\/g, '/');
    const uploadIndex = normalizedPath.indexOf('uploads/');
    if (uploadIndex !== -1) {
      return '/' + normalizedPath.substring(uploadIndex);
    }
    return `/uploads/attendance/${file.filename}`;
  }
}

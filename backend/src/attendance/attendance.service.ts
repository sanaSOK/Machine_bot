import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance, AttendanceAction } from './attendance.entity';
import { User } from '../users/user.entity';
import { Department } from '../admin/department.entity';
import { Branch } from '../branches/branch.entity';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { TelegramService } from '../telegram/telegram.service';
import { SettingsService } from '../admin/settings.service';

export interface TodayStatusResponse {
  checkIn: Attendance | null;
  checkOut: Attendance | null;
  status: 'NOT_CHECKED_IN' | 'WORKING' | 'COMPLETED';
  canCheckIn: boolean;
  canCheckOut: boolean;
}

import { WorksService } from '../staffs/works.service';
import { Optional } from '@nestjs/common';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly telegramService: TelegramService,
    private readonly settingsService: SettingsService,
    @Optional()
    private readonly worksService?: WorksService,
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
      relations: ['branch'],
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

  private async getValidDepartmentId(): Promise<number> {
    try {
      const dept1 = await this.departmentRepository.findOne({ where: { id: 1 } });
      if (dept1) return dept1.id;

      const anyDept = await this.departmentRepository.findOne({ where: {} });
      if (anyDept) return anyDept.id;

      // If no department exists in MySQL, insert the default General department
      const newDept = this.departmentRepository.create({
        id: 1,
        name: 'General',
        description: 'General Department',
        color: '#6366f1',
      });
      const saved = await this.departmentRepository.save(newDept);
      return saved.id;
    } catch {
      return 1;
    }
  }

  private async resolveStaffUser(user: User | any): Promise<User> {
    if (!user || !user.id) {
      throw new BadRequestException('User context is invalid');
    }

    if (user.department_id && user.branch) {
      const deptExists = await this.departmentRepository.findOne({ where: { id: user.department_id } });
      if (deptExists) {
        return user;
      }
    }

    const validDeptId = await this.getValidDepartmentId();

    const existingStaff = await this.userRepository.findOne({ where: { id: user.id }, relations: ['branch'] });
    if (existingStaff) {
      if (!existingStaff.department_id || existingStaff.department_id !== validDeptId) {
        existingStaff.department_id = validDeptId;
        await this.userRepository.save(existingStaff);
      }
      if (this.worksService && existingStaff.id && existingStaff.department_id) {
        try {
          await this.worksService.ensureStaffWorkSchedule(existingStaff.id, existingStaff.department_id);
        } catch (e) {
          // Non-blocking
        }
      }
      return existingStaff;
    }

    const staffName = user.fullname;
    const newStaff = this.userRepository.create({
      id: user.id,
      first_name: staffName,
      department_id: validDeptId,
      branch_id: 1,
      role: 1,
      is_active: true,
      photo_url: user.photo_url || user.profile_url || null,
    });
    const savedStaff = await this.userRepository.save(newStaff);
    if (this.worksService && savedStaff.id && savedStaff.department_id) {
      try {
        await this.worksService.ensureStaffWorkSchedule(savedStaff.id, savedStaff.department_id);
      } catch (e) {
        // Non-blocking
      }
    }
    return savedStaff;
  }

  async checkIn(
    user: User,
    file: Express.Multer.File | undefined,
    dto: CheckInDto,
  ): Promise<Attendance> {
    if (!file) {
      throw new BadRequestException('Attendance photo is required for check in');
    }

    const staffUser = await this.resolveStaffUser(user);
    const photoUrl = this.formatFileUrl(file);
    const branchId = staffUser.branch_id || 1;

    let branch = staffUser.branch;
    if (!branch || branch.id !== branchId) {
      branch = await this.branchRepository.findOne({ where: { id: branchId } });
    }
    const branchName = branch?.name || 'Head Office';

    // Save Check-In record with current exact timestamp
    const attendance = this.attendanceRepository.create({
      branch_id: branchId,
      branch: branch || undefined,
      user_id: staffUser.id,
      user: staffUser,
      action: AttendanceAction.CHECK_IN,
      photo_url: photoUrl,
      latitude: dto.latitude !== undefined ? dto.latitude : null,
      longitude: dto.longitude !== undefined ? dto.longitude : null,
      address: dto.address || null,
      created_at: new Date(), // Current Live Exact Timestamp
    });

    const saved = await this.attendanceRepository.save(attendance);
    if (!saved.branch && branch) {
      saved.branch = branch;
    }

    // Send Telegram Photo Notification Alert
    this.sendTelegramCheckInNotification(staffUser, file.path, saved, branchName).catch((e) =>
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

    const staffUser = await this.resolveStaffUser(user);

    const todayStatus = await this.getTodayStatus(staffUser.id);
    if (!todayStatus.canCheckOut) {
      throw new BadRequestException('Cannot check out: You are not currently checked in.');
    }

    const photoUrl = this.formatFileUrl(file);
    const branchId = staffUser.branch_id || 1;

    let branch = staffUser.branch;
    if (!branch || branch.id !== branchId) {
      branch = await this.branchRepository.findOne({ where: { id: branchId } });
    }
    const branchName = branch?.name || 'Head Office';

    // Save Check-Out record with current exact timestamp
    const attendance = this.attendanceRepository.create({
      branch_id: branchId,
      branch: branch || undefined,
      user_id: staffUser.id,
      user: staffUser,
      action: AttendanceAction.CHECK_OUT,
      photo_url: photoUrl,
      latitude: dto.latitude !== undefined ? dto.latitude : null,
      longitude: dto.longitude !== undefined ? dto.longitude : null,
      address: dto.address || null,
      created_at: new Date(), // Current Live Exact Timestamp
    });

    const saved = await this.attendanceRepository.save(attendance);
    if (!saved.branch && branch) {
      saved.branch = branch;
    }

    // Send Telegram Photo Notification Alert
    this.sendTelegramCheckOutNotification(staffUser, file.path, saved, branchName).catch((e) =>
      console.warn('Failed to send Telegram check-out notification:', e),
    );

    return saved;
  }

  private async sendTelegramCheckInNotification(
    user: User,
    filePath: string,
    attendance: Attendance,
    branchName: string,
  ) {
    if (!user.telegram_user_id) return;

    const settings = this.settingsService.getSettings();
    const now = new Date(attendance.created_at);

    let workStartTime = settings.workStartTime || '08:00';
    let gracePeriod = settings.gracePeriodMinutes ?? 15;

    if (this.worksService && user.id && user.department_id) {
      try {
        const staffWork = await this.worksService.getStaffWorkSchedule(user.id, user.department_id);
        if (staffWork?.work_start_time) {
          workStartTime = staffWork.work_start_time;
        }
        if (staffWork?.grace_period_minutes != null) {
          gracePeriod = staffWork.grace_period_minutes;
        }
      } catch (e) {
        // Fallback to settings
      }
    }

    const [startHour, startMin] = workStartTime.split(':').map(Number);
    const workStartMins = (startHour || 8) * 60 + (startMin || 0);
    const maxOnTimeMins = workStartMins + gracePeriod;

    const checkInMins = now.getHours() * 60 + now.getMinutes();

    let status = 'ON_TIME';
    let lateText = '';
    if (checkInMins > maxOnTimeMins) {
      const lateMins = checkInMins - maxOnTimeMins;
      status = 'LATE';
      lateText = `- <b>Late: ${lateMins} min</b>\n`;
    }

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Employee';
    const empId = `EMP${String(user.id).padStart(3, '0')}`;
    const department = user.role || 'Electrical';

    let mapsText = '';
    if (attendance.latitude != null && attendance.longitude != null) {
      const lat = Number(attendance.latitude);
      const lng = Number(attendance.longitude);
      mapsText = `- <b>Google Maps:</b> https://www.google.com/maps?q=${lat},${lng}\n`;
    }

    const caption =
      `⚠️ <b>ATTENDANCE ALERT</b>\n\n` +
      `✅ <b>CHECK IN SUCCESS</b>\n\n` +
      `- <b>🏢 Branch:</b> ${branchName}\n` +
      `- <b>👤 Name:</b> ${fullName}\n` +
      `- <b>🆔 ID:</b> ${empId}\n` +
      `- <b>📁 Role:</b> ${department}\n` +
      `- <b>⏰ Status: ${status}</b>\n` +
      lateText +
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
    branchName: string,
  ) {
    const settings = this.settingsService.getSettings();

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Employee';
    const empId = `EMP${String(user.id).padStart(3, '0')}`;
    const department = user.role || 'Electrical';

    let mapsText = '';
    if (attendance.latitude != null && attendance.longitude != null) {
      const lat = Number(attendance.latitude);
      const lng = Number(attendance.longitude);
      mapsText = `- <b>Google Maps:</b> https://www.google.com/maps?q=${lat},${lng}\n`;
    }

    const caption =
      `⚠️ <b>ATTENDANCE ALERT</b>\n\n` +
      `🚪 <b>CHECK OUT SUCCESS</b>\n\n` +
      `- <b>🏢 Branch:</b> ${branchName}\n` +
      `- <b>👤 Name:</b> ${fullName}\n` +
      `- <b>🆔 ID:</b> ${empId}\n` +
      `- <b>📁 Role:</b> ${department}\n` +
      `- <b>⏰ Status: CHECK OUT</b>\n` +
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
      relations: ['branch'],
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

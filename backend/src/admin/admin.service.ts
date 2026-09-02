import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../users/user.entity';
import { Attendance, AttendanceAction } from '../attendance/attendance.entity';

export interface AdminAttendanceQueryDto {
  search?: string;
  type?: 'CHECK_IN' | 'CHECK_OUT';
  date?: string;
  limit?: number;
  offset?: number;
}

export interface AdminEmployeeQueryDto {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface SystemSettings {
  companyName: string;
  logoUrl?: string;
  workStartTime: string;
  workEndTime: string;
  gracePeriodMinutes: number;
  requireGps: boolean;
  requireDualPhoto: boolean;
  pageSize: number;
  telegramBotToken: string;
  telegramNotificationChatId?: string;
}

@Injectable()
export class AdminService {
  private readonly settingsPath = path.join(process.cwd(), 'uploads', 'system_settings.json');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  getSettings(): SystemSettings {
    const defaultSettings: SystemSettings = {
      companyName: 'Eroxii Enterprise',
      logoUrl: '/logo.png',
      workStartTime: '08:00',
      workEndTime: '17:00',
      gracePeriodMinutes: 15,
      requireGps: true,
      requireDualPhoto: true,
      pageSize: 10,
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ? `${process.env.TELEGRAM_BOT_TOKEN.slice(0, 10)}...` : 'Not Configured',
      telegramNotificationChatId: process.env.TELEGRAM_NOTIFICATION_CHAT_ID || '',
    };

    try {
      if (fs.existsSync(this.settingsPath)) {
        const raw = fs.readFileSync(this.settingsPath, 'utf8');
        const parsed = JSON.parse(raw);
        return { ...defaultSettings, ...parsed };
      }
    } catch (e) {
      console.warn('Read settings.json error:', e);
    }
    return defaultSettings;
  }

  updateSettings(dto: Partial<SystemSettings>): SystemSettings {
    const current = this.getSettings();
    const updated = { ...current, ...dto };

    try {
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.settingsPath, JSON.stringify(updated, null, 2), 'utf8');
    } catch (e) {
      console.warn('Write settings.json error:', e);
    }

    return updated;
  }

  async updateUserRole(userId: number, role: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    user.role = (role || '').trim().toUpperCase() || 'EMPLOYEE';
    return this.userRepository.save(user);
  }

  async getStats() {
    const totalEmployees = await this.userRepository.count({ where: { is_active: true } });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const todayCheckIns = await this.attendanceRepository.count({
      where: {
        action: AttendanceAction.CHECK_IN,
        created_at: Between(startOfDay, endOfDay),
      },
    });

    const todayCheckOuts = await this.attendanceRepository.count({
      where: {
        action: AttendanceAction.CHECK_OUT,
        created_at: Between(startOfDay, endOfDay),
      },
    });

    const todayAbsents = Math.max(0, totalEmployees - todayCheckIns);

    return {
      totalEmployees,
      todayCheckIns,
      todayCheckOuts,
      todayAbsents,
    };
  }

  async getAttendanceLogs(query: AdminAttendanceQueryDto) {
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const qb = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .orderBy('attendance.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    if (query.type) {
      qb.andWhere('attendance.action = :type', { type: query.type });
    }

    if (query.date) {
      const selectedDate = new Date(query.date);
      if (!isNaN(selectedDate.getTime())) {
        const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0);
        const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);
        qb.andWhere('attendance.created_at BETWEEN :start AND :end', { start, end });
      }
    }

    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(user.first_name) LIKE :term OR LOWER(user.last_name) LIKE :term OR LOWER(user.username) LIKE :term)',
        { term },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  async getEmployees(query?: AdminEmployeeQueryDto) {
    const limit = query?.limit || 10;
    const offset = query?.offset || 0;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.attendances', 'attendance')
      .select([
        'user.id',
        'user.telegram_user_id',
        'user.username',
        'user.first_name',
        'user.last_name',
        'user.photo_url',
        'user.role',
        'user.is_active',
        'user.created_at',
        'attendance.id',
        'attendance.action',
        'attendance.created_at',
      ])
      .loadRelationCountAndMap('user.totalAttendances', 'user.attendances')
      .orderBy('user.id', 'ASC')
      .take(limit)
      .skip(offset);

    if (query?.search) {
      const term = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(user.first_name) LIKE :term OR LOWER(user.last_name) LIKE :term OR LOWER(user.username) LIKE :term)',
        { term },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const formattedUsers = data.map((u) => {
      const todayLogs = (u.attendances || []).filter((a) => new Date(a.created_at) >= startOfDay);
      const todayCheckIn = todayLogs.find((a) => a.action === 'CHECK_IN');
      const todayCheckOut = todayLogs.find((a) => a.action === 'CHECK_OUT');
      return {
        ...u,
        todayCheckIn: todayCheckIn ? { created_at: todayCheckIn.created_at } : null,
        todayCheckOut: todayCheckOut ? { created_at: todayCheckOut.created_at } : null,
      };
    });

    return {
      data: formattedUsers,
      total,
      limit,
      offset,
    };
  }

  async exportExcel(): Promise<Buffer> {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Eroxii Attendance System';
    workbook.lastModifiedBy = 'Eroxii Admin';
    workbook.created = new Date();

    const settings = this.getSettings();
    const records = await this.attendanceRepository.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
    const users = await this.userRepository.find({
      where: { is_active: true },
      order: { id: 'ASC' },
    });

    const [startHour, startMin] = (settings.workStartTime || '08:00').split(':').map(Number);
    const workStartMinutes = (startHour || 8) * 60 + (startMin || 0);
    const gracePeriod = settings.gracePeriodMinutes ?? 15;
    const maxOnTimeMinutes = workStartMinutes + gracePeriod;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    // Calculate Today & All-Time Subtotals per user
    const userSummaryList: any[] = [];
    let presentTodayCount = 0;
    let lateTodayCount = 0;
    let absentTodayCount = 0;

    let overallPresentsAllTime = 0;
    let overallLatesAllTime = 0;
    let overallAbsentsAllTime = 0;
    let overallCheckOutsAllTime = 0;
    let overallCheckInsAllTime = 0;

    for (const u of users) {
      const userAllLogs = records.filter((r) => r.user?.id === u.id);
      const userCheckIns = userAllLogs.filter((r) => r.action === AttendanceAction.CHECK_IN);
      const userCheckOuts = userAllLogs.filter((r) => r.action === AttendanceAction.CHECK_OUT);

      let userPresentsCount = 0;
      let userLatesCount = 0;

      userCheckIns.forEach((ci) => {
        const d = new Date(ci.created_at);
        const checkInMins = d.getHours() * 60 + d.getMinutes();
        if (checkInMins > maxOnTimeMinutes) {
          userLatesCount++;
        } else {
          userPresentsCount++;
        }
      });

      // Today's Status
      const userTodayLogs = userCheckIns.filter((r) => new Date(r.created_at) >= startOfDay);
      let todayStatus = 'ABSENT';
      let checkInTimeStr = 'N/A';
      let lateMinutesStr = '0';
      let userAbsentCount = 0;

      if (userTodayLogs.length > 0) {
        const earliestCheckIn = userTodayLogs[userTodayLogs.length - 1];
        const d = new Date(earliestCheckIn.created_at);
        checkInTimeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const checkInMins = d.getHours() * 60 + d.getMinutes();

        if (checkInMins > maxOnTimeMinutes) {
          const lateBy = checkInMins - maxOnTimeMinutes;
          todayStatus = `LATE (${lateBy}m)`;
          lateMinutesStr = `${lateBy} mins`;
          lateTodayCount++;
        } else {
          todayStatus = 'PRESENT';
          presentTodayCount++;
        }
      } else {
        todayStatus = 'ABSENT';
        userAbsentCount = 1;
        absentTodayCount++;
      }

      overallPresentsAllTime += userPresentsCount;
      overallLatesAllTime += userLatesCount;
      overallAbsentsAllTime += userAbsentCount;
      overallCheckOutsAllTime += userCheckOuts.length;
      overallCheckInsAllTime += userCheckIns.length;

      userSummaryList.push({
        id: u.id,
        fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        username: u.username ? `@${u.username}` : 'N/A',
        role: u.role || 'EMPLOYEE',
        statusToday: todayStatus,
        checkInTimeToday: checkInTimeStr,
        lateMinutesToday: lateMinutesStr,
        totalPresents: userPresentsCount,
        totalLates: userLatesCount,
        totalAbsents: userAbsentCount,
        totalCheckOuts: userCheckOuts.length,
        totalCheckIns: userCheckIns.length,
      });
    }

    // --- SHEET 1: User Subtotals & Summary ---
    const sheet1 = workbook.addWorksheet('User Subtotals & Summary');

    sheet1.addRow(['EROXII ATTENDANCE SYSTEM - SUMMARY & SUB-TOTALS REPORT']);
    sheet1.addRow(['Export Date:', now.toLocaleString('en-US')]);
    sheet1.addRow(['Organization:', settings.companyName || 'Eroxii Enterprise']);
    sheet1.addRow(['Shift Hours:', `${settings.workStartTime} - ${settings.workEndTime} (Grace: ${gracePeriod} mins)`]);
    sheet1.addRow([]);

    sheet1.addRow(['OVERALL ATTENDANCE SUB-TOTAL STATISTICS']);
    sheet1.addRow(['Total Registered Active Users:', users.length]);
    sheet1.addRow(['Total Present Users (Today):', presentTodayCount]);
    sheet1.addRow(['Total Late Users (Today):', lateTodayCount]);
    sheet1.addRow(['Total Absent Users (Today):', absentTodayCount]);
    sheet1.addRow(['Total Presents (All Time):', overallPresentsAllTime]);
    sheet1.addRow(['Total Lates (All Time):', overallLatesAllTime]);
    sheet1.addRow(['Total Absents (Today):', overallAbsentsAllTime]);
    sheet1.addRow(['Total Check-In Logs (All Time):', overallCheckInsAllTime]);
    sheet1.addRow(['Total Check-Out Logs (All Time):', overallCheckOutsAllTime]);
    sheet1.addRow([]);

    sheet1.addRow(['USER ATTENDANCE BREAKDOWN & SUB-TOTALS']);
    const userTableHeaders = [
      'User ID',
      'Full Name',
      'Username',
      'Role',
      'Today Status',
      'Today Check-In Time',
      'Today Late Mins',
      'Total Presents',
      'Total Lates',
      'Total Absents',
      'Total Check-Outs',
      'Total Check-Ins',
    ];
    sheet1.addRow(userTableHeaders);

    userSummaryList.forEach((u) => {
      sheet1.addRow([
        u.id,
        u.fullName,
        u.username,
        u.role,
        u.statusToday,
        u.checkInTimeToday,
        u.lateMinutesToday,
        u.totalPresents,
        u.totalLates,
        u.totalAbsents,
        u.totalCheckOuts,
        u.totalCheckIns,
      ]);
    });

    // Summary Subtotal Footer Row
    sheet1.addRow([]);
    sheet1.addRow([
      'GRAND TOTALS',
      `Users: ${users.length}`,
      '',
      '',
      `Present: ${presentTodayCount} | Late: ${lateTodayCount} | Absent: ${absentTodayCount}`,
      '',
      '',
      overallPresentsAllTime,
      overallLatesAllTime,
      overallAbsentsAllTime,
      overallCheckOutsAllTime,
      overallCheckInsAllTime,
    ]);

    sheet1.columns = [
      { width: 12 },
      { width: 25 },
      { width: 20 },
      { width: 15 },
      { width: 18 },
      { width: 22 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
    ];

    // --- SHEET 2: Detailed Attendance Logs ---
    const sheet2 = workbook.addWorksheet('Attendance Logs');

    const logHeaders = ['Record ID', 'Date', 'Time', 'Telegram ID', 'Username', 'Full Name', 'Action', 'Status', 'Latitude', 'Longitude', 'Address', 'Photo URL'];
    sheet2.addRow(logHeaders);

    records.forEach((r) => {
      const d = new Date(r.created_at);
      const dateStr = d.toISOString().split('T')[0];
      const timeStr = d.toTimeString().split(' ')[0];
      const fullName = `${r.user?.first_name || ''} ${r.user?.last_name || ''}`.trim();

      let statusStr = 'CHECK OUT';
      if (r.action === AttendanceAction.CHECK_IN) {
        const checkInMins = d.getHours() * 60 + d.getMinutes();
        if (checkInMins > maxOnTimeMinutes) {
          const lateBy = checkInMins - maxOnTimeMinutes;
          statusStr = `LATE (${lateBy}m)`;
        } else {
          statusStr = 'PRESENT';
        }
      }

      sheet2.addRow([
        r.id,
        dateStr,
        timeStr,
        r.user?.telegram_user_id || '',
        r.user?.username || '',
        fullName,
        r.action,
        statusStr,
        r.latitude || '',
        r.longitude || '',
        r.address || '',
        r.photo_url || '',
      ]);
    });

    sheet2.columns = [
      { width: 12 },
      { width: 14 },
      { width: 12 },
      { width: 18 },
      { width: 18 },
      { width: 22 },
      { width: 14 },
      { width: 16 },
      { width: 14 },
      { width: 14 },
      { width: 35 },
      { width: 40 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

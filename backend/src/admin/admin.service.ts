import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../users/user.entity';
import { Attendance, AttendanceAction } from '../attendance/attendance.entity';
import { Department } from './department.entity';
import { TelegramService } from '../telegram/telegram.service';

export interface AdminAttendanceQueryDto {
  search?: string;
  type?: 'CHECK_IN' | 'CHECK_OUT';
  date?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface AdminEmployeeQueryDto {
  search?: string;
  role?: string;
  department?: string;
  limit?: number;
  offset?: number;
}

export interface DepartmentItem {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  userCount?: number;
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
  departments?: DepartmentItem[];
}

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly settingsPath = path.join(process.cwd(), 'uploads', 'system_settings.json');

  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly telegramService: TelegramService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultDepartments();
  }

  private getDefaultDepartments(): DepartmentItem[] {
    return [
      { id: 'dept_teacher', name: 'TEACHER', description: 'Academic teaching & instruction staff', color: '#818cf8', createdAt: '2026-08-30T00:00:00.000Z' },
      { id: 'dept_employee', name: 'EMPLOYEE', description: 'General company employee & operational staff', color: '#38bdf8', createdAt: '2026-08-30T00:00:00.000Z' },
      { id: 'dept_electrical', name: 'ELECTRICAL', description: 'Electrical engineering & technical maintenance', color: '#f59e0b', createdAt: '2026-08-30T00:00:00.000Z' },
      { id: 'dept_it', name: 'IT', description: 'Information technology & software engineering', color: '#10b981', createdAt: '2026-08-30T00:00:00.000Z' },
      { id: 'dept_hr', name: 'HR', description: 'Human resources & administrative operations', color: '#ec4899', createdAt: '2026-08-30T00:00:00.000Z' },
    ];
  }

  private async seedDefaultDepartments() {
    try {
      const count = await this.departmentRepository.count();
      if (count === 0) {
        const defaults = this.getDefaultDepartments();
        for (const d of defaults) {
          const entity = this.departmentRepository.create({
            name: d.name,
            description: d.description,
            color: d.color,
          });
          await this.departmentRepository.save(entity);
        }
      }
    } catch (e) {
      console.warn('Seed default departments error:', e);
    }
  }

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
      departments: this.getDefaultDepartments(),
    };

    try {
      if (fs.existsSync(this.settingsPath)) {
        const raw = fs.readFileSync(this.settingsPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed.departments || !Array.isArray(parsed.departments) || parsed.departments.length === 0) {
          parsed.departments = this.getDefaultDepartments();
        }
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

  async getDepartments(): Promise<DepartmentItem[]> {
    await this.seedDefaultDepartments();
    const depts = await this.departmentRepository.find({ order: { id: 'ASC' } });
    const users = await this.userRepository.find();

    return depts.map((d) => {
      const count = users.filter((u) => (u.role || '').trim().toUpperCase() === d.name.toUpperCase()).length;
      return {
        id: String(d.id),
        name: d.name,
        description: d.description || `${d.name} Department`,
        color: d.color || '#6366f1',
        createdAt: d.createdAt ? d.createdAt.toISOString() : new Date().toISOString(),
        userCount: count,
      };
    });
  }

  async createDepartment(dto: { name: string; description?: string; color?: string }): Promise<DepartmentItem[]> {
    const cleanName = (dto.name || '').trim().toUpperCase();
    if (!cleanName) {
      throw new Error('Department name is required');
    }

    await this.seedDefaultDepartments();
    const existing = await this.departmentRepository.findOne({ where: { name: cleanName } });
    if (existing) {
      throw new Error(`Department "${cleanName}" already exists`);
    }

    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#38bdf8', '#8b5cf6', '#ef4444', '#14b8a6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newDept = this.departmentRepository.create({
      name: cleanName,
      description: (dto.description || '').trim() || `${cleanName} Department`,
      color: dto.color || randomColor,
    });

    await this.departmentRepository.save(newDept);
    return this.getDepartments();
  }

  async deleteDepartment(idOrName: string): Promise<DepartmentItem[]> {
    const clean = idOrName.trim().toUpperCase();
    const numericId = parseInt(idOrName, 10);

    if (!isNaN(numericId)) {
      await this.departmentRepository.delete({ id: numericId });
    } else {
      await this.departmentRepository.delete({ name: clean });
    }

    return this.getDepartments();
  }

  async updateUserRole(userId: number, role: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    const cleanRole = (role || '').trim().toUpperCase() || 'EMPLOYEE';
    user.role = cleanRole;

    await this.seedDefaultDepartments();
    const existing = await this.departmentRepository.findOne({ where: { name: cleanRole } });
    if (!existing) {
      const newDept = this.departmentRepository.create({
        name: cleanRole,
        description: `${cleanRole} Department`,
        color: '#6366f1',
      });
      await this.departmentRepository.save(newDept);
    }

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
      .orderBy('attendance.created_at', 'DESC');

    if (query.type) {
      qb.andWhere('attendance.action = :type', { type: query.type });
    }

    if (query.status) {
      if (query.status === 'CHECK_OUT') {
        qb.andWhere('attendance.action = :stAct', { stAct: 'CHECK_OUT' });
      } else if (query.status === 'PRESENT' || query.status === 'LATE' || query.status === 'CHECK_IN') {
        qb.andWhere('attendance.action = :stAct', { stAct: 'CHECK_IN' });
      }
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

    let data: Attendance[] = [];
    let total = 0;

    if (query.status === 'PRESENT' || query.status === 'LATE') {
      const allRecords = await qb.getMany();
      const settings = this.getSettings();
      const [startHour, startMin] = (settings.workStartTime || '08:00').split(':').map(Number);
      const maxOnTimeMins = (startHour || 8) * 60 + (startMin || 0) + (settings.gracePeriodMinutes ?? 15);

      const filtered = allRecords.filter((r) => {
        if (r.action !== AttendanceAction.CHECK_IN) return false;
        const d = new Date(r.created_at);
        const checkInMins = d.getHours() * 60 + d.getMinutes();
        return query.status === 'LATE' ? checkInMins > maxOnTimeMins : checkInMins <= maxOnTimeMins;
      });

      total = filtered.length;
      data = filtered.slice(offset, offset + limit);
    } else {
      qb.take(limit).skip(offset);
      [data, total] = await qb.getManyAndCount();
    }

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

    const targetDept = (query?.department || query?.role || '').trim();
    if (targetDept) {
      qb.andWhere('LOWER(user.role) = :targetDept', { targetDept: targetDept.toLowerCase() });
    }

    if (query?.search) {
      const term = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(user.first_name) LIKE :term OR LOWER(user.last_name) LIKE :term OR LOWER(user.username) LIKE :term OR LOWER(user.role) LIKE :term)',
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

  async generateDailySummaryReportText(): Promise<string> {
    const settings = this.getSettings();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const dateStr = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const employees = await this.userRepository.find({ where: { is_active: true } });
    const totalEmployees = employees.length;

    const todayRecords = await this.attendanceRepository.find({
      where: {
        created_at: Between(startOfDay, endOfDay),
      },
      relations: ['user'],
      order: { created_at: 'ASC' },
    });

    const [startHour, startMin] = (settings.workStartTime || '08:00').split(':').map(Number);
    const maxOnTimeMins = (startHour || 8) * 60 + (startMin || 0) + (settings.gracePeriodMinutes ?? 15);

    let onTimeCount = 0;
    let lateCount = 0;
    let checkOutCount = 0;

    const employeeSummaryList: string[] = [];

    for (const emp of employees) {
      const empName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.username || `User #${emp.id}`;
      const empId = `EMP${String(emp.id).padStart(3, '0')}`;

      const empRecords = todayRecords.filter((r) => r.user_id === emp.id);
      const checkInRec = empRecords.find((r) => r.action === AttendanceAction.CHECK_IN);
      const checkOutRec = empRecords.slice().reverse().find((r) => r.action === AttendanceAction.CHECK_OUT);

      if (checkOutRec) {
        checkOutCount++;
      }

      if (checkInRec) {
        const d = new Date(checkInRec.created_at);
        const checkInMins = d.getHours() * 60 + d.getMinutes();
        const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

        if (checkInMins > maxOnTimeMins) {
          lateCount++;
          const lateMins = checkInMins - maxOnTimeMins;
          employeeSummaryList.push(`• <b>${empName}</b> (${empId}) - <code>${timeStr}</code> 🟠 <b>LATE (+${lateMins}m)</b>`);
        } else {
          onTimeCount++;
          employeeSummaryList.push(`• <b>${empName}</b> (${empId}) - <code>${timeStr}</code> 🟢 <b>ON TIME</b>`);
        }
      } else {
        employeeSummaryList.push(`• <b>${empName}</b> (${empId}) - 🔴 <b>ABSENT</b>`);
      }
    }

    const absentCount = Math.max(0, totalEmployees - (onTimeCount + lateCount));
    const company = settings.companyName || 'Attendance Test';

    const text =
      `📊 <b>DAILY ATTENDANCE SUMMARY DIGEST</b>\n` +
      `🏢 <b>Company:</b> ${company}\n` +
      `📅 <b>Date:</b> ${dateStr}\n\n` +
      `📈 <b>STATISTICS:</b>\n` +
      `👥 Total Employees: <b>${totalEmployees}</b>\n` +
      `🟢 On-Time Check-Ins: <b>${onTimeCount}</b>\n` +
      `🟠 Late Check-Ins: <b>${lateCount}</b>\n` +
      `🚪 Check-Outs Completed: <b>${checkOutCount}</b>\n` +
      `🔴 Absentees: <b>${absentCount}</b>\n\n` +
      `📋 <b>EMPLOYEE ATTENDANCE DETAILS:</b>\n` +
      employeeSummaryList.join('\n');

    return text;
  }

  async sendDailySummaryReport(): Promise<boolean> {
    const settings = this.getSettings();
    const groupId = process.env.TELEGRAM_NOTIFICATION_CHAT_ID || settings.telegramNotificationChatId || '-1005192733304';
    
    // 1. Post Group Summary Digest to Topic 10 ("Daily_Summary")
    let groupTarget = groupId;
    if (groupTarget && !groupTarget.includes(':')) {
      groupTarget = `${groupId}:10`; // Daily_Summary topic ID 10
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const dateStr = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const groupText = await this.generateDailySummaryReportText();
    let groupSuccess = false;
    if (groupTarget) {
      const res = await this.telegramService.sendMessage(groupTarget, groupText);
      groupSuccess = !!res;
    }

    // 2. Send Individual Personal Attendance Summary to each employee via private DM
    const employees = await this.userRepository.find({ where: { is_active: true } });
    const todayRecords = await this.attendanceRepository.find({
      where: {
        created_at: Between(startOfDay, endOfDay),
      },
      order: { created_at: 'ASC' },
    });

    const [startHour, startMin] = (settings.workStartTime || '08:00').split(':').map(Number);
    const maxOnTimeMins = (startHour || 8) * 60 + (startMin || 0) + (settings.gracePeriodMinutes ?? 15);

    for (const emp of employees) {
      if (emp.telegram_user_id) {
        try {
          const empRecords = todayRecords.filter((r) => r.user_id === emp.id);
          const checkInRec = empRecords.find((r) => r.action === AttendanceAction.CHECK_IN);
          const checkOutRec = empRecords.slice().reverse().find((r) => r.action === AttendanceAction.CHECK_OUT);

          let personalStatusText = '🔴 <b>ABSENT (No check-in record today)</b>';
          if (checkInRec) {
            const d = new Date(checkInRec.created_at);
            const checkInMins = d.getHours() * 60 + d.getMinutes();
            const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

            if (checkInMins > maxOnTimeMins) {
              const lateMins = checkInMins - maxOnTimeMins;
              personalStatusText = `- <b>Check-In:</b> <code>${timeStr}</code>\n🟠 <b>Status: LATE (+${lateMins}m)</b>`;
            } else {
              personalStatusText = `- <b>Check-In:</b> <code>${timeStr}</code>\n🟢 <b>Status: ON TIME</b>`;
            }

            if (checkOutRec) {
              const outD = new Date(checkOutRec.created_at);
              const outTimeStr = outD.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
              personalStatusText += `\n- <b>Check-Out:</b> <code>${outTimeStr}</code>`;
            }
          }

          const personalMsg =
            `👋 <b>Hello ${emp.first_name || 'Employee'}!</b>\n\n` +
            `- <b>Your Daily Attendance Summary</b>\n` +
            `- <b>Company:</b> ${settings.companyName || 'Attendance System'}\n` +
            `- <b>Date:</b> ${dateStr}\n\n` +
            `${personalStatusText}\n\n` +
            `<i>Thank you for your hard work today!</i>`;

          await this.telegramService.sendMessage(emp.telegram_user_id, personalMsg);
        } catch (e) {
          // ignore error if user hasn't opened private chat with bot
        }
      }
    }

    return groupSuccess || true;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../users/user.entity';
import { Attendance, AttendanceAction } from '../attendance/attendance.entity';
import { TelegramService } from '../telegram/telegram.service';
import { SettingsService } from './settings.service';
import { resolveBranchScope } from '../common/utils/branch-scope.util';

/**
 * ReportsService — handles Excel exports and Telegram daily summary reports.
 * Isolated from core admin CRUD logic for Single Responsibility.
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly telegramService: TelegramService,
    private readonly settingsService: SettingsService,
  ) {}

  // ── Excel Export ───────────────────────────────────────────────────────────

  async exportExcel(user?: any): Promise<Buffer> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Eroxii Attendance System';
    workbook.lastModifiedBy = 'Eroxii Admin';
    workbook.created = new Date();

    const branchId = user ? resolveBranchScope(user) : null;
    const settings = this.settingsService.getSettings();

    const qbRecords = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .leftJoinAndSelect('attendance.branch', 'branch')
      .orderBy('attendance.created_at', 'DESC');

    if (branchId) {
      qbRecords.andWhere('(attendance.branch_id = :branchId OR user.branch_id = :branchId)', { branchId });
    }
    const records = await qbRecords.getMany();

    const staffWhere: any = { is_active: true };
    if (branchId) staffWhere.branch_id = branchId;

    const users = await this.userRepository.find({
      where: staffWhere,
      relations: ['branch'],
      order: { id: 'ASC' },
    });

    const [startHour, startMin] = (settings.workStartTime || '08:00').split(':').map(Number);
    const workStartMinutes = (startHour || 8) * 60 + (startMin || 0);
    const gracePeriod = settings.gracePeriodMinutes ?? 15;
    const maxOnTimeMinutes = workStartMinutes + gracePeriod;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

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
        branch: u.branch?.name || 'Head Office',
        fullName: `${u.first_name || ''} ${(u as any).last_name || ''}`.trim(),
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

    // Sheet 1: User Subtotals & Summary
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
    sheet1.addRow([
      'User ID', 'Branch', 'Full Name', 'Username', 'Role',
      'Today Status', 'Today Check-In Time', 'Today Late Mins',
      'Total Presents', 'Total Lates', 'Total Absents', 'Total Check-Outs', 'Total Check-Ins',
    ]);
    userSummaryList.forEach((u) => {
      sheet1.addRow([
        u.id, u.branch, u.fullName, u.username, u.role,
        u.statusToday, u.checkInTimeToday, u.lateMinutesToday,
        u.totalPresents, u.totalLates, u.totalAbsents, u.totalCheckOuts, u.totalCheckIns,
      ]);
    });
    sheet1.addRow([]);
    sheet1.addRow([
      'GRAND TOTALS', `Users: ${users.length}`, '', '',
      `Present: ${presentTodayCount} | Late: ${lateTodayCount} | Absent: ${absentTodayCount}`,
      '', '', overallPresentsAllTime, overallLatesAllTime,
      overallAbsentsAllTime, overallCheckOutsAllTime, overallCheckInsAllTime,
    ]);
    sheet1.columns = [
      { width: 12 }, { width: 25 }, { width: 20 }, { width: 15 },
      { width: 18 }, { width: 22 }, { width: 18 }, { width: 18 },
      { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 },
    ];

    // Sheet 2: Detailed Attendance Logs
    const sheet2 = workbook.addWorksheet('Attendance Logs');
    sheet2.addRow([
      'Record ID', 'Branch', 'Date', 'Time', 'Telegram ID',
      'Username', 'Full Name', 'Action', 'Status',
      'Latitude', 'Longitude', 'Address', 'Photo URL',
    ]);

    records.forEach((r) => {
      const d = new Date(r.created_at);
      const dateStr = d.toISOString().split('T')[0];
      const timeStr = d.toTimeString().split(' ')[0];
      const fullName = `${r.user?.first_name || ''} ${(r.user as any)?.last_name || ''}`.trim();

      let statusStr = 'CHECK OUT';
      if (r.action === AttendanceAction.CHECK_IN) {
        const checkInMins = d.getHours() * 60 + d.getMinutes();
        statusStr = checkInMins > maxOnTimeMinutes
          ? `LATE (${checkInMins - maxOnTimeMinutes}m)`
          : 'PRESENT';
      }

      sheet2.addRow([
        r.id, r.branch?.name || 'Head Office', dateStr, timeStr,
        r.user?.telegram_user_id || '', r.user?.username || '', fullName,
        r.action, statusStr, r.latitude || '', r.longitude || '',
        r.address || '', r.photo_url || '',
      ]);
    });
    sheet2.columns = [
      { width: 12 }, { width: 14 }, { width: 12 }, { width: 18 },
      { width: 18 }, { width: 22 }, { width: 14 }, { width: 16 },
      { width: 14 }, { width: 14 }, { width: 35 }, { width: 40 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ── Daily Summary ──────────────────────────────────────────────────────────

  async generateDailySummaryReportText(): Promise<string> {
    const settings = this.settingsService.getSettings();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const dateStr = now.toLocaleDateString('en-GB', {
      weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
    });

    const employees = await this.userRepository.find({ where: { is_active: true }, relations: ['branch'] });
    const todayRecords = await this.attendanceRepository.find({
      where: { created_at: Between(startOfDay, endOfDay) },
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
      const empName = `${emp.first_name || ''} ${(emp as any).last_name || ''}`.trim() || emp.username || `User #${emp.id}`;
      const empId = `EMP${String(emp.id).padStart(3, '0')}`;
      const branchTag = emp.branch?.name ? `[${emp.branch.name}] ` : '';

      const empRecords = todayRecords.filter((r) => r.user_id === emp.id);
      const checkInRec = empRecords.find((r) => r.action === AttendanceAction.CHECK_IN);
      const checkOutRec = empRecords.slice().reverse().find((r) => r.action === AttendanceAction.CHECK_OUT);

      if (checkOutRec) checkOutCount++;

      if (checkInRec) {
        const d = new Date(checkInRec.created_at);
        const checkInMins = d.getHours() * 60 + d.getMinutes();
        const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

        if (checkInMins > maxOnTimeMins) {
          lateCount++;
          const lateMins = checkInMins - maxOnTimeMins;
          employeeSummaryList.push(`• ${branchTag}<b>${empName}</b> (${empId}) - <code>${timeStr}</code> 🟠 <b>LATE (+${lateMins}m)</b>`);
        } else {
          onTimeCount++;
          employeeSummaryList.push(`• ${branchTag}<b>${empName}</b> (${empId}) - <code>${timeStr}</code> 🟢 <b>ON TIME</b>`);
        }
      } else {
        employeeSummaryList.push(`• ${branchTag}<b>${empName}</b> (${empId}) - 🔴 <b>ABSENT</b>`);
      }
    }

    const absentCount = Math.max(0, employees.length - (onTimeCount + lateCount));
    const company = settings.companyName || 'Attendance Test';

    return (
      `📊 <b>DAILY ATTENDANCE SUMMARY DIGEST</b>\n` +
      `🏢 <b>Company:</b> ${company}\n` +
      `📅 <b>Date:</b> ${dateStr}\n\n` +
      `📈 <b>STATISTICS:</b>\n` +
      `👥 Total Employees: <b>${employees.length}</b>\n` +
      `🟢 On-Time Check-Ins: <b>${onTimeCount}</b>\n` +
      `🟠 Late Check-Ins: <b>${lateCount}</b>\n` +
      `🚪 Check-Outs Completed: <b>${checkOutCount}</b>\n` +
      `🔴 Absentees: <b>${absentCount}</b>\n\n` +
      `📋 <b>EMPLOYEE ATTENDANCE DETAILS:</b>\n` +
      employeeSummaryList.join('\n')
    );
  }

  async sendDailySummaryReport(): Promise<boolean> {
    const settings = this.settingsService.getSettings();
    const groupId = process.env.TELEGRAM_NOTIFICATION_CHAT_ID || settings.telegramNotificationChatId || '';

    let groupTarget = groupId;
    if (groupTarget && !groupTarget.includes(':')) {
      groupTarget = `${groupId}:10`; // Daily_Summary topic ID 10
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const dateStr = now.toLocaleDateString('en-GB', {
      weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
    });

    const groupText = await this.generateDailySummaryReportText();
    let groupSuccess = false;

    if (groupTarget) {
      const res = await this.telegramService.sendMessage(groupTarget, groupText);
      groupSuccess = !!res;
    }

    // Send personal DM to each employee
    const employees = await this.userRepository.find({ where: { is_active: true } });
    const todayRecords = await this.attendanceRepository.find({
      where: { created_at: Between(startOfDay, endOfDay) },
      order: { created_at: 'ASC' },
    });

    const [startHour, startMin] = (settings.workStartTime || '08:00').split(':').map(Number);
    const maxOnTimeMins = (startHour || 8) * 60 + (startMin || 0) + (settings.gracePeriodMinutes ?? 15);

    for (const emp of employees) {
      if (!emp.telegram_user_id) continue;

      try {
        const empRecords = todayRecords.filter((r) => r.user_id === emp.id);
        const checkInRec = empRecords.find((r) => r.action === AttendanceAction.CHECK_IN);
        const checkOutRec = empRecords.slice().reverse().find((r) => r.action === AttendanceAction.CHECK_OUT);

        let personalStatusText = '🔴 <b>ABSENT (No check-in record today)</b>';

        if (checkInRec) {
          const d = new Date(checkInRec.created_at);
          const checkInMins = d.getHours() * 60 + d.getMinutes();
          const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

          personalStatusText = checkInMins > maxOnTimeMins
            ? `- <b>Check-In:</b> <code>${timeStr}</code>\n🟠 <b>Status: LATE (+${checkInMins - maxOnTimeMins}m)</b>`
            : `- <b>Check-In:</b> <code>${timeStr}</code>\n🟢 <b>Status: ON TIME</b>`;

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
      } catch {
        // Ignore — user may not have started a private chat with the bot
      }
    }

    return groupSuccess || true;
  }
}

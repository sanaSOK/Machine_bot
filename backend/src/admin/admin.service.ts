import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../users/user.entity';
import { Attendance, AttendanceAction } from '../attendance/attendance.entity';
import { resolveBranchScope } from '../common/utils/branch-scope.util';
import { DepartmentsService } from '../departments/departments.service';
import { SettingsService } from './settings.service';

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

/**
 * AdminService — core admin business logic.
 *
 * Responsibilities:
 *   - Dashboard stats
 *   - Attendance log queries
 *   - Employee list & detail
 *   - Staff user mutations (role, status, update, delete)
 *
 * Delegates to:
 *   - DepartmentsService  → department CRUD
 *   - SettingsService     → system settings
 *   - ReportsService      → Excel export + Telegram summary
 */
import { WorksService } from '../staffs/works.service';
import { Optional } from '@nestjs/common';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly departmentsService: DepartmentsService,
    private readonly settingsService: SettingsService,
    @Optional()
    private readonly worksService?: WorksService,
  ) {}



  async getStats(user?: any, requestedBranchId?: number) {
    const branchId = user ? resolveBranchScope(user, requestedBranchId) : null;
    const staffWhere: any = { is_active: true };
    if (branchId) staffWhere.branch_id = branchId;

    const totalEmployees = await this.userRepository.count({ where: staffWhere });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const qbCheckIns = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoin('attendance.user', 'user')
      .where('attendance.action = :action', { action: AttendanceAction.CHECK_IN })
      .andWhere('attendance.created_at BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay });

    if (branchId) {
      qbCheckIns.andWhere('(attendance.branch_id = :branchId OR user.branch_id = :branchId)', { branchId });
    }
    const todayCheckIns = await qbCheckIns.getCount();

    const qbCheckOuts = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoin('attendance.user', 'user')
      .where('attendance.action = :action', { action: AttendanceAction.CHECK_OUT })
      .andWhere('attendance.created_at BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay });

    if (branchId) {
      qbCheckOuts.andWhere('(attendance.branch_id = :branchId OR user.branch_id = :branchId)', { branchId });
    }
    const todayCheckOuts = await qbCheckOuts.getCount();
    const todayAbsents = Math.max(0, totalEmployees - todayCheckIns);

    return { totalEmployees, todayCheckIns, todayCheckOuts, todayAbsents };
  }



  async getAttendanceLogs(user: any, query: AdminAttendanceQueryDto, requestedBranchId?: number) {
    const branchId = user ? resolveBranchScope(user, requestedBranchId) : null;
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const qb = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .leftJoinAndSelect('attendance.branch', 'branch')
      .orderBy('attendance.created_at', 'DESC');

    if (branchId) {
      qb.andWhere('(attendance.branch_id = :branchId OR user.branch_id = :branchId)', { branchId });
    }
    if (query.type) {
      qb.andWhere('attendance.action = :type', { type: query.type });
    }
    if (query.status) {
      const actionMap: Record<string, string> = {
        CHECK_OUT: 'CHECK_OUT', PRESENT: 'CHECK_IN', LATE: 'CHECK_IN', CHECK_IN: 'CHECK_IN',
      };
      if (actionMap[query.status]) {
        qb.andWhere('attendance.action = :stAct', { stAct: actionMap[query.status] });
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
      qb.andWhere('LOWER(user.first_name) LIKE :term', { term });
    }

    let data: Attendance[] = [];
    let total = 0;

    if (query.status === 'PRESENT' || query.status === 'LATE') {
      const allRecords = await qb.getMany();
      const settings = this.settingsService.getSettings();
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

    return { data, total, limit, offset };
  }


  async getEmployees(user: any, query?: AdminEmployeeQueryDto, requestedBranchId?: number) {
    const branchId = user ? resolveBranchScope(user, requestedBranchId) : null;
    const limit = query?.limit || 10;
    const offset = query?.offset || 0;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.attendances', 'attendance')
      .leftJoinAndSelect('user.branch', 'branch')
      .select([
        'user.id', 'user.department_id', 'user.branch_id', 'user.first_name',
        'user.username', 'user.telegram_user_id', 'user.phone', 'user.photo_url',
        'user.role', 'user.is_active', 'user.created_at',
        'branch.id', 'branch.name', 'branch.address',
        'attendance.id', 'attendance.action', 'attendance.created_at',
      ])
      .loadRelationCountAndMap('user.totalAttendances', 'user.attendances')
      .orderBy('user.id', 'ASC')
      .take(limit)
      .skip(offset);

    if (branchId) {
      qb.andWhere('user.branch_id = :branchId', { branchId });
    }

    const targetDept = (query?.department || query?.role || '').trim();
    if (targetDept) {
      qb.andWhere('user.role = :targetDept', { targetDept });
    }

    if (query?.search) {
      const term = `%${query.search.toLowerCase()}%`;
      qb.andWhere('(LOWER(user.first_name) LIKE :term OR LOWER(user.username) LIKE :term)', { term });
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

    return { data: formattedUsers, total, limit, offset };
  }

  async getUserDetails(userId: number, userContext?: any) {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['branch'] });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    if (userContext) resolveBranchScope(userContext, user.branch_id);

    const [recentLogs, totalLogs] = await Promise.all([
      this.attendanceRepository.find({
        where: { user_id: userId },
        relations: ['branch'],
        order: { created_at: 'DESC' },
        take: 20,
      }),
      this.attendanceRepository.count({ where: { user_id: userId } }),
    ]);

    return { user, totalLogs, recentLogs };
  }


  async updateUserRole(userId: number, role: string, userContext?: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    if (userContext) resolveBranchScope(userContext, user.branch_id);

    const cleanRole = (role || '').trim().toUpperCase() || 'EMPLOYEE';
    user.role = cleanRole;

    // Auto-create department if it doesn't exist
    const branchId = user.branch_id || 1;
    const dept = await this.departmentsService.ensureDepartmentExists(cleanRole, branchId);
    user.department_id = dept.id;

    const saved = await this.userRepository.save(user);
    if (this.worksService && saved.id && saved.department_id) {
      try {
        await this.worksService.ensureStaffWorkSchedule(saved.id, saved.department_id);
      } catch (e) {
        // Non-blocking
      }
    }
    return saved;
  }

  async toggleUserStatus(userId: number, isActive: boolean, userContext?: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    if (userContext) resolveBranchScope(userContext, user.branch_id);

    user.is_active = isActive;
    return this.userRepository.save(user);
  }

  async updateUser(
    userId: number,
    dto: {
      first_name?: string;
      last_name?: string;
      username?: string;
      role?: string;
      address?: string;
      is_active?: boolean;
      branch_id?: number;
    },
    userContext?: any,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['branch'] });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    if (userContext) {
      resolveBranchScope(userContext, user.branch_id);
      if (dto.branch_id !== undefined) resolveBranchScope(userContext, dto.branch_id);
    }

    if (dto.branch_id !== undefined) user.branch_id = dto.branch_id;
    if (dto.first_name !== undefined) user.first_name = dto.first_name.trim();
    if (dto.last_name !== undefined) user.last_name = dto.last_name ? dto.last_name.trim() : null;
    if (dto.username !== undefined) user.username = dto.username ? dto.username.trim().replace(/^@/, '') : null;
    if (dto.address !== undefined) user.address = dto.address ? dto.address.trim() : null;
    if (dto.is_active !== undefined) user.is_active = !!dto.is_active;

    if (dto.role) {
      const cleanRole = dto.role.trim().toUpperCase() || 'EMPLOYEE';
      user.role = cleanRole;
      const branchId = user.branch_id || 1;
      const dept = await this.departmentsService.ensureDepartmentExists(cleanRole, branchId);
      user.department_id = dept.id;
    }

    const saved = await this.userRepository.save(user);
    if (this.worksService && saved.id && saved.department_id) {
      try {
        await this.worksService.ensureStaffWorkSchedule(saved.id, saved.department_id);
      } catch (e) {
        // Non-blocking
      }
    }
    return this.userRepository.findOne({ where: { id: saved.id }, relations: ['branch'] }) || saved;
  }

  async deleteUser(userId: number, userContext?: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    if (userContext) resolveBranchScope(userContext, user.branch_id);

    await this.attendanceRepository.delete({ user_id: userId });
    await this.userRepository.remove(user);
    return { success: true, message: `User #${userId} deleted successfully` };
  }
}

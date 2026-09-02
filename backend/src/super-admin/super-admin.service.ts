import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../users/user.entity';
import { Attendance, AttendanceAction } from '../attendance/attendance.entity';
import { AdminOrganization } from './admin-organization.entity';
import { AdminService } from '../admin/admin.service';

export interface AdminOrgItem {
  id: string;
  companyName: string;
  adminUsername: string;
  contactEmail: string;
  logoUrl?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  workStartTime: string;
  workEndTime: string;
  gracePeriodMinutes: number;
  telegramBotToken?: string;
  telegramNotificationChatId?: string;
  createdAt: string;
  totalEmployees?: number;
  todayCheckIns?: number;
}

export interface SuperAdminStats {
  totalAdminOrgs: number;
  activeAdminOrgs: number;
  suspendedAdminOrgs: number;
  totalSystemEmployees: number;
  totalTodayCheckIns: number;
}

@Injectable()
export class SuperAdminService implements OnModuleInit {
  constructor(
    @InjectRepository(AdminOrganization, 'superAdminConnection')
    private readonly adminOrgRepository: Repository<AdminOrganization>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly adminService: AdminService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultAdminOrg();
  }

  private async seedDefaultAdminOrg() {
    try {
      const count = await this.adminOrgRepository.count();
      if (count === 0) {
        const currentSettings = this.adminService.getSettings();
        const defaultOrg = this.adminOrgRepository.create({
          companyName: currentSettings.companyName || 'Eroxii Enterprise',
          adminUsername: 'eroxii_admin',
          contactEmail: 'admin@eroxii.com',
          logoUrl: currentSettings.logoUrl || '/logo.png',
          status: 'ACTIVE',
          workStartTime: currentSettings.workStartTime || '08:00',
          workEndTime: currentSettings.workEndTime || '17:00',
          gracePeriodMinutes: currentSettings.gracePeriodMinutes ?? 15,
          telegramBotToken: currentSettings.telegramBotToken || '',
          telegramNotificationChatId: currentSettings.telegramNotificationChatId || '',
        });
        await this.adminOrgRepository.save(defaultOrg);
      }
    } catch (e) {
      console.warn('Seed default admin organization error:', e);
    }
  }

  async getSuperAdminStats(): Promise<SuperAdminStats> {
    await this.seedDefaultAdminOrg();

    const totalAdminOrgs = await this.adminOrgRepository.count();
    const activeAdminOrgs = await this.adminOrgRepository.count({ where: { status: 'ACTIVE' } });
    const suspendedAdminOrgs = await this.adminOrgRepository.count({ where: { status: 'SUSPENDED' } });

    const totalSystemEmployees = await this.userRepository.count({ where: { is_active: true } });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const totalTodayCheckIns = await this.attendanceRepository.count({
      where: {
        action: AttendanceAction.CHECK_IN,
        created_at: Between(startOfDay, endOfDay),
      },
    });

    return {
      totalAdminOrgs,
      activeAdminOrgs,
      suspendedAdminOrgs,
      totalSystemEmployees,
      totalTodayCheckIns,
    };
  }

  async getAdminOrgs(): Promise<AdminOrgItem[]> {
    await this.seedDefaultAdminOrg();

    const orgEntities = await this.adminOrgRepository.find({ order: { id: 'ASC' } });
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

    return orgEntities.map((org, index) => {
      const isEroxii = index === 0 || org.companyName.toLowerCase().includes('eroxii');
      return {
        id: String(org.id),
        companyName: org.companyName,
        adminUsername: org.adminUsername,
        contactEmail: org.contactEmail || '',
        logoUrl: org.logoUrl || '/logo.png',
        status: org.status || 'ACTIVE',
        workStartTime: org.workStartTime || '08:00',
        workEndTime: org.workEndTime || '17:00',
        gracePeriodMinutes: org.gracePeriodMinutes ?? 15,
        telegramBotToken: org.telegramBotToken || '',
        telegramNotificationChatId: org.telegramNotificationChatId || '',
        createdAt: org.createdAt ? org.createdAt.toISOString() : new Date().toISOString(),
        totalEmployees: isEroxii ? totalEmployees : 0,
        todayCheckIns: isEroxii ? todayCheckIns : 0,
      };
    });
  }

  async createAdminOrg(dto: Partial<AdminOrgItem>): Promise<AdminOrgItem[]> {
    const companyName = (dto.companyName || '').trim();
    if (!companyName) {
      throw new Error('Company name is required');
    }

    const cleanUsername = (dto.adminUsername || `${companyName.toLowerCase().replace(/\s+/g, '_')}_admin`).trim();

    const existing = await this.adminOrgRepository.findOne({
      where: [{ companyName }, { adminUsername: cleanUsername }],
    });

    if (existing) {
      throw new Error(`Admin Organization "${companyName}" or username "${cleanUsername}" already exists`);
    }

    const newOrg = this.adminOrgRepository.create({
      companyName,
      adminUsername: cleanUsername,
      contactEmail: (dto.contactEmail || `admin@${companyName.toLowerCase().replace(/\s+/g, '')}.com`).trim(),
      logoUrl: dto.logoUrl || '/logo.png',
      status: dto.status || 'ACTIVE',
      workStartTime: dto.workStartTime || '08:00',
      workEndTime: dto.workEndTime || '17:00',
      gracePeriodMinutes: dto.gracePeriodMinutes ?? 15,
      telegramBotToken: dto.telegramBotToken || '',
      telegramNotificationChatId: dto.telegramNotificationChatId || '',
    });

    await this.adminOrgRepository.save(newOrg);
    return this.getAdminOrgs();
  }

  async updateAdminOrg(id: string, dto: Partial<AdminOrgItem>): Promise<AdminOrgItem[]> {
    const numericId = parseInt(id, 10);
    const org = await this.adminOrgRepository.findOne({ where: { id: numericId } });
    if (!org) {
      throw new Error(`Admin Organization with ID ${id} not found`);
    }

    if (dto.companyName) org.companyName = dto.companyName.trim();
    if (dto.adminUsername) org.adminUsername = dto.adminUsername.trim();
    if (dto.contactEmail !== undefined) org.contactEmail = dto.contactEmail;
    if (dto.logoUrl !== undefined) org.logoUrl = dto.logoUrl;
    if (dto.status) org.status = dto.status;
    if (dto.workStartTime) org.workStartTime = dto.workStartTime;
    if (dto.workEndTime) org.workEndTime = dto.workEndTime;
    if (dto.gracePeriodMinutes !== undefined) org.gracePeriodMinutes = dto.gracePeriodMinutes;
    if (dto.telegramBotToken !== undefined) org.telegramBotToken = dto.telegramBotToken;
    if (dto.telegramNotificationChatId !== undefined) org.telegramNotificationChatId = dto.telegramNotificationChatId;

    await this.adminOrgRepository.save(org);
    return this.getAdminOrgs();
  }

  async toggleAdminOrgStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<AdminOrgItem[]> {
    return this.updateAdminOrg(id, { status });
  }

  async deleteAdminOrg(id: string): Promise<AdminOrgItem[]> {
    const numericId = parseInt(id, 10);
    await this.adminOrgRepository.delete({ id: numericId });
    return this.getAdminOrgs();
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../users/user.entity';
import { Attendance, AttendanceAction } from '../attendance/attendance.entity';
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
export class SuperAdminService {
  private readonly orgsPath = path.join(process.cwd(), 'uploads', 'admin_organizations.json');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly adminService: AdminService,
  ) {}

  private getDefaultOrgs(): AdminOrgItem[] {
    const currentSettings = this.adminService.getSettings();
    return [
      {
        id: 'org_eroxii',
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
        createdAt: '2026-08-30T00:00:00.000Z',
      },
    ];
  }

  private readOrgsFile(): AdminOrgItem[] {
    try {
      if (fs.existsSync(this.orgsPath)) {
        const raw = fs.readFileSync(this.orgsPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Read admin_organizations.json error:', e);
    }
    return this.getDefaultOrgs();
  }

  private saveOrgsFile(orgs: AdminOrgItem[]) {
    try {
      const dir = path.dirname(this.orgsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.orgsPath, JSON.stringify(orgs, null, 2), 'utf8');
    } catch (e) {
      console.warn('Write admin_organizations.json error:', e);
    }
  }

  async getSuperAdminStats(): Promise<SuperAdminStats> {
    const orgs = this.readOrgsFile();
    const totalAdminOrgs = orgs.length;
    const activeAdminOrgs = orgs.filter((o) => o.status === 'ACTIVE').length;
    const suspendedAdminOrgs = orgs.filter((o) => o.status === 'SUSPENDED').length;

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
    const orgs = this.readOrgsFile();
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

    return orgs.map((org, index) => {
      // Eroxii Enterprise gets live current database count
      if (org.id === 'org_eroxii' || index === 0) {
        return {
          ...org,
          totalEmployees,
          todayCheckIns,
        };
      }
      return {
        ...org,
        totalEmployees: org.totalEmployees || 0,
        todayCheckIns: org.todayCheckIns || 0,
      };
    });
  }

  async createAdminOrg(dto: Partial<AdminOrgItem>): Promise<AdminOrgItem[]> {
    const companyName = (dto.companyName || '').trim();
    if (!companyName) {
      throw new Error('Company name is required');
    }

    const orgs = this.readOrgsFile();
    const cleanUsername = (dto.adminUsername || `${companyName.toLowerCase().replace(/\s+/g, '_')}_admin`).trim();

    if (orgs.some((o) => o.companyName.toLowerCase() === companyName.toLowerCase())) {
      throw new Error(`Admin Organization "${companyName}" already exists`);
    }

    const newOrg: AdminOrgItem = {
      id: `org_${Date.now()}`,
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
      createdAt: new Date().toISOString(),
      totalEmployees: 0,
      todayCheckIns: 0,
    };

    const updated = [...orgs, newOrg];
    this.saveOrgsFile(updated);
    return this.getAdminOrgs();
  }

  async updateAdminOrg(id: string, dto: Partial<AdminOrgItem>): Promise<AdminOrgItem[]> {
    const orgs = this.readOrgsFile();
    const index = orgs.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error(`Admin Organization with ID ${id} not found`);
    }

    orgs[index] = {
      ...orgs[index],
      ...dto,
      companyName: dto.companyName ? dto.companyName.trim() : orgs[index].companyName,
    };

    this.saveOrgsFile(orgs);
    return this.getAdminOrgs();
  }

  async toggleAdminOrgStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<AdminOrgItem[]> {
    return this.updateAdminOrg(id, { status });
  }

  async deleteAdminOrg(id: string): Promise<AdminOrgItem[]> {
    const orgs = this.readOrgsFile();
    const updated = orgs.filter((o) => o.id !== id);
    this.saveOrgsFile(updated);
    return this.getAdminOrgs();
  }
}

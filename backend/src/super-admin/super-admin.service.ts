import { Injectable, ConflictException, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AdminUser } from '../users/admin-user.entity';
import { User } from '../users/user.entity';
import { Attendance, AttendanceAction } from '../attendance/attendance.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminResponseDto } from './dto/admin-response.dto';
import { AdminRole } from '../common/decorators/roles.decorator';
import { PasswordUtil } from '../common/utils/password.util';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

export interface SuperAdminStats {
  totalAdmins: number;
  totalActiveStaff: number;
  totalTodayCheckIns: number;
}

@Injectable()
export class SuperAdminService implements OnModuleInit {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultSuperAdmin();
  }

  /**
   * Auto seed init @Account_Super_Admin
   * @bydefualt:
   * email: superadmin@eroxii.com
   * password: Admin@1234
   */
  async seedDefaultSuperAdmin() {
    try {
      const existingSuperAdmin = await this.adminUserRepository.findOne({
        where: { role: AdminRole.SUPER_ADMIN },
      });

      if (!existingSuperAdmin) {
        const rootSuperAdmin = this.adminUserRepository.create({
          fullname: 'Super Admin',
          email: 'superadmin@eroxii.com',
          password: PasswordUtil.hashPassword('Admin@1234'),
          role: AdminRole.SUPER_ADMIN,
          is_active: 1,
          is_verified: 1,
        });

        await this.adminUserRepository.save(rootSuperAdmin);
      }
    } catch (error) {
      this.logger.error('Failed seed default Super Admin:', error);
    }
  }

  async createAdmin(dto: CreateAdminDto): Promise<AdminResponseDto> {
    const cleanEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.adminUserRepository.findOne({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new ConflictException(`An Admin with email "${cleanEmail}" already exists`);
    }

    const hashedPassword = PasswordUtil.hashPassword(dto.password);
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

    const newAdmin = this.adminUserRepository.create({
      fullname: dto.fullname.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: AdminRole.ADMIN, 
      is_active: 1,
      is_verified: 0,
      verification_token_hash: tokenHash,
      verification_expires: expires,
      profile_url: dto.profile_url?.trim() || null,
    });

    const saved = await this.adminUserRepository.save(newAdmin);

    // Send verification email
    await this.mailService.sendVerificationEmail(saved.email, rawToken);

    return this.toResponseDto(saved);
  }

  async getAdmins(status?: number): Promise<AdminResponseDto[]> {
    const where: any = { role: AdminRole.ADMIN };
    if (status !== undefined && status !== null && !isNaN(status)) {
      where.is_active = status;
    }

    const admins = await this.adminUserRepository.find({
      where,
      order: { created_at: 'DESC' },
    });

    return admins.map((admin) => this.toResponseDto(admin));
  }

  async updateAdminStatus(id: number, isActive: number): Promise<AdminResponseDto> {
    const admin = await this.adminUserRepository.findOne({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException(`Admin account with ID ${id} not found`);
    }

    if (admin.role === AdminRole.SUPER_ADMIN) {
      throw new ConflictException('Cannot change status of a Super Admin account');
    }

    admin.is_active = isActive;
    const updated = await this.adminUserRepository.save(admin);
    return this.toResponseDto(updated);
  }


  async deleteAdmin(id: number): Promise<{ success: boolean; message: string }> {
    const admin = await this.adminUserRepository.findOne({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException(`Admin account with ID ${id} not found`);
    }

    if (admin.role === AdminRole.SUPER_ADMIN) {
      throw new ConflictException('Cannot delete a Super Admin account');
    }

    await this.adminUserRepository.delete(id);
    return { success: true, message: `Admin account "${admin.email}" successfully deleted` };
  }


  async getSuperAdminStats(): Promise<SuperAdminStats> {
    const totalAdmins = await this.adminUserRepository.count({
      where: { role: AdminRole.ADMIN },
    });

    const totalActiveStaff = await this.userRepository.count({
      where: { is_active: true },
    });

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
      totalAdmins,
      totalActiveStaff,
      totalTodayCheckIns,
    };
  }

  private toResponseDto(entity: AdminUser): AdminResponseDto {
    return {
      id: entity.id,
      fullname: entity.fullname,
      email: entity.email,
      profile_url: entity.profile_url,
      role: entity.role,
      is_active: entity.is_active,
      is_verified: entity.is_verified,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}

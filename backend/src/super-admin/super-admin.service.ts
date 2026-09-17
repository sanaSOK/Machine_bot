import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { AdminUser } from '../users/admin-user.entity';
import { User } from '../users/user.entity';
import { Attendance, AttendanceAction } from '../attendance/attendance.entity';
import { Branch } from '../branches/branch.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminResponseDto, BranchSummaryDto } from './dto/admin-response.dto';
import { AdminRole } from '../common/decorators/roles.decorator';
import { PasswordUtil } from '../common/utils/password.util';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

export interface SuperAdminStats {
  totalAdmins: number;
  totalBranches: number;
  totalActiveStaff: number;
  totalTodayCheckIns: number;
}

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly mailService: MailService,
  ) {}

  async createAdmin(dto: CreateAdminDto, creatorId: number = 1): Promise<AdminResponseDto> {
    const cleanEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.adminUserRepository.findOne({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      throw new ConflictException(`An Admin with email "${cleanEmail}" already exists`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const branch = await queryRunner.manager.findOne(Branch, {
        where: { id: dto.branch_id },
      });

      if (!branch) {
        throw new NotFoundException(`Branch with ID ${dto.branch_id} not found`);
      }

      const existingAssigned = await queryRunner.manager.findOne(AdminUser, {
        where: { branch_id: dto.branch_id },
      });

      if (existingAssigned || (branch.admin_id && branch.admin_id !== null)) {
        throw new ConflictException(
          `Branch "${branch.name}" is already assigned to another Admin account`,
        );
      }

      const rawChatId = dto.telegram_chat_id ?? dto.chat_id;
      let telegramChatId: string | null = null;
      if (rawChatId !== undefined && rawChatId !== null && String(rawChatId).trim() !== '') {
        telegramChatId = String(rawChatId).trim();
        const existingTelegram = await queryRunner.manager.findOne(AdminUser, {
          where: { telegram_chat_id: telegramChatId },
        });
        if (existingTelegram) {
          throw new ConflictException(
            `An Admin with Telegram Chat ID "${telegramChatId}" already exists`,
          );
        }
      }

      const hashedPassword = PasswordUtil.hashPassword(dto.password);
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

      const newAdmin = queryRunner.manager.create(AdminUser, {
        fullname: dto.fullname.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: AdminRole.ADMIN,
        branch_id: branch.id,
        telegram_chat_id: telegramChatId,
        is_active: 1,
        is_verified: 0,
        verification_token_hash: tokenHash,
        verification_expires: expires,
        profile_url: dto.profile_url?.trim() || null,
      });

      const savedAdmin = await queryRunner.manager.save(newAdmin);

      branch.admin_id = savedAdmin.id;
      await queryRunner.manager.save(branch);

      await queryRunner.commitTransaction();

      // Dispatch verification email (non-blocking outside transaction)
      try {
        await this.mailService.sendVerificationEmail(savedAdmin.email, rawToken);
      } catch (mailError) {
        this.logger.warn(`Failed to send verification email to ${savedAdmin.email}: ${mailError}`);
      }

      return this.toResponseDto(savedAdmin, branch);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to create Admin and assign Branch:', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getAdmins(status?: number): Promise<AdminResponseDto[]> {
    const where: any = { role: AdminRole.ADMIN };
    if (status !== undefined && status !== null && !isNaN(status)) {
      where.is_active = status;
    }

    const admins = await this.adminUserRepository.find({
      where,
      relations: ['branch'],
      order: { created_at: 'DESC' },
    });

    return admins.map((admin) => this.toResponseDto(admin, admin.branch));
  }

  async updateAdminStatus(id: number, isActive: number): Promise<AdminResponseDto> {
    const admin = await this.adminUserRepository.findOne({
      where: { id },
      relations: ['branch'],
    });

    if (!admin) {
      throw new NotFoundException(`Admin account with ID ${id} not found`);
    }

    if (admin.role === AdminRole.SUPER_ADMIN) {
      throw new ConflictException('Cannot change status of a Super Admin account');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      admin.is_active = isActive;
      await queryRunner.manager.save(admin);

      if (admin.branch) {
        admin.branch.is_active = isActive;
        await queryRunner.manager.save(admin.branch);
      }

      await queryRunner.commitTransaction();
      return this.toResponseDto(admin, admin.branch);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteAdmin(id: number): Promise<{ success: boolean; message: string }> {
    const admin = await this.adminUserRepository.findOne({
      where: { id },
      relations: ['branch'],
    });

    if (!admin) {
      throw new NotFoundException(`Admin account with ID ${id} not found`);
    }

    if (admin.role === AdminRole.SUPER_ADMIN) {
      throw new ConflictException('Cannot delete a Super Admin account');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (admin.branch_id) {
        await queryRunner.manager.update(Branch, admin.branch_id, { admin_id: null });
      }

      // Delete admin
      await queryRunner.manager.delete(AdminUser, id);

      await queryRunner.commitTransaction();
      return { success: true, message: `Admin account "${admin.email}" successfully deleted` };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getSuperAdminStats(): Promise<SuperAdminStats> {
    const totalAdmins = await this.adminUserRepository.count({
      where: { role: AdminRole.ADMIN },
    });

    const totalBranches = await this.branchRepository.count();

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
      totalBranches,
      totalActiveStaff,
      totalTodayCheckIns,
    };
  }

  private toResponseDto(entity: AdminUser, branch?: Branch | null): AdminResponseDto {
    let branchDto: BranchSummaryDto | null = null;
    if (branch) {
      branchDto = {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        admin_id: branch.admin_id,
        is_active: branch.is_active,
      };
    }

    return {
      id: entity.id,
      fullname: entity.fullname,
      email: entity.email,
      profile_url: entity.profile_url,
      role: entity.role,
      branch_id: entity.branch_id,
      telegram_chat_id: entity.telegram_chat_id ?? null,
      branch: branchDto,
      is_active: entity.is_active,
      is_verified: entity.is_verified,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}

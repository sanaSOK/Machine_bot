import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramService } from '../telegram/telegram.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { AdminUser } from '../users/admin-user.entity';
import { AdminLoginDto } from './dto/admin-login.dto';
import { PasswordUtil } from '../common/utils/password.util';
import { AccountStatus } from '../common/enums/account-status.enum';
import { AdminRole } from '../common/decorators/roles.decorator';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

export interface AdminAuthResponse {
  accessToken: string;
  user: {
    id: number;
    fullname: string;
    email: string;
    role: number;
    branch_id?: number | null;
    branch?: {
      id: number;
      name: string;
      address?: string | null;
      phone?: string | null;
      is_active: number;
    } | null;
    profile_url: string | null;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    private readonly mailService: MailService,
  ) {}

  async validateTelegramAuth(initData: string): Promise<{ accessToken: string; user: User }> {
    const validated = this.telegramService.validateInitData(initData);
    const user = await this.usersService.findOrCreateFromTelegram(validated.user);
    const payload = {
      sub: user.id,
      telegram_user_id: user.telegram_user_id,
      type: 'staff',
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  async validateAdminLogin(dto: AdminLoginDto): Promise<AdminAuthResponse> {
    const cleanEmail = dto.email.trim().toLowerCase();

    const admin = await this.adminUserRepository.findOne({
      where: { email: cleanEmail },
      relations: ['branch'],
    });

    if (!admin || !admin.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = PasswordUtil.verifyPassword(dto.password, admin.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (admin.is_active !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('Admin account has been deactivated');
    }

    if (admin.role === AdminRole.ADMIN && admin.branch && admin.branch.is_active !== 1) {
      throw new UnauthorizedException('Assigned branch has been deactivated');
    }

    if (admin.role === AdminRole.ADMIN && !admin.is_verified) {
      throw new UnauthorizedException('Please confirm your email address to activate your account');
    }

    admin.last_login = new Date();
    await this.adminUserRepository.save(admin);

    const payload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      branch_id: admin.branch_id,
      type: 'admin',
    };

    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: {
        id: admin.id,
        fullname: admin.fullname,
        email: admin.email,
        role: admin.role,
        branch_id: admin.branch_id,
        branch: admin.branch
          ? {
              id: admin.branch.id,
              name: admin.branch.name,
              address: admin.branch.address,
              phone: admin.branch.phone,
              is_active: admin.branch.is_active,
            }
          : null,
        profile_url: admin.profile_url,
      },
    };
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    if (!token || !token.trim()) {
      throw new BadRequestException('Verification token is required');
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const admin = await this.adminUserRepository.findOne({
      where: { verification_token_hash: tokenHash },
    });

    if (!admin) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (admin.verification_expires && admin.verification_expires < new Date()) {
      throw new BadRequestException('Verification link has expired. Please request a new verification link.');
    }

    admin.is_verified = 1;
    admin.verification_token_hash = null;
    admin.verification_expires = null;
    await this.adminUserRepository.save(admin);
    return {
      success: true,
      message: 'Email verified successfully! You can now log in to your account.',
    };
  }

  async resendVerificationLink(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();

    const admin = await this.adminUserRepository.findOne({
      where: { email: cleanEmail },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with email "${cleanEmail}" not found`);
    }

    if (admin.is_verified) {
      throw new BadRequestException('This account has already been verified');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresInMinutes = 15; // link expired 15m

    admin.verification_token_hash = tokenHash;
    admin.verification_expires = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    await this.adminUserRepository.save(admin);
    await this.mailService.sendVerificationEmail(admin.email, rawToken);
    return {
      success: true,
      message: 'Verification link resent successfully. Please check your email.',
    };
  }
}

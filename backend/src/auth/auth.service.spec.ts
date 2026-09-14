import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TelegramService } from '../telegram/telegram.service';
import { UsersService } from '../users/users.service';
import { AdminUser } from '../users/admin-user.entity';
import { MailService } from '../mail/mail.service';
import { PasswordUtil } from '../common/utils/password.util';
import * as crypto from 'crypto';

describe('AuthService - Email Verification', () => {
  let service: AuthService;
  let adminUserRepositoryMock: any;
  let mailServiceMock: any;

  beforeEach(async () => {
    adminUserRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity })),
    };

    mailServiceMock = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: TelegramService,
          useValue: {},
        },
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock_jwt_token') },
        },
        {
          provide: getRepositoryToken(AdminUser),
          useValue: adminUserRepositoryMock,
        },
        {
          provide: MailService,
          useValue: mailServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateAdminLogin - Email Verification Guard', () => {
    it('should reject login if admin is not verified (is_verified = 0)', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue({
        id: 2,
        email: 'admin@eroxii.com',
        password: PasswordUtil.hashPassword('Password123!'),
        role: 2,
        is_active: 1,
        is_verified: 0,
      });

      await expect(
        service.validateAdminLogin({
          email: 'admin@eroxii.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email when valid token is provided', async () => {
      const rawToken = 'valid_token_12345';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const mockAdmin = {
        id: 2,
        email: 'admin@eroxii.com',
        is_verified: 0,
        verification_token_hash: tokenHash,
        verification_expires: new Date(Date.now() + 10 * 60 * 1000), // expires in 10 mins
      };

      adminUserRepositoryMock.findOne.mockResolvedValue(mockAdmin);

      const result = await service.verifyEmail(rawToken);
      expect(result.success).toBe(true);
      expect(mockAdmin.is_verified).toBe(1);
      expect(mockAdmin.verification_token_hash).toBeNull();
      expect(mockAdmin.verification_expires).toBeNull();
    });

    it('should throw BadRequestException if token is invalid', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid_token')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if token is expired', async () => {
      const rawToken = 'expired_token_123';
      const mockAdmin = {
        id: 2,
        email: 'admin@eroxii.com',
        is_verified: 0,
        verification_token_hash: 'hash',
        verification_expires: new Date(Date.now() - 5 * 60 * 1000), // expired 5 mins ago
      };

      adminUserRepositoryMock.findOne.mockResolvedValue(mockAdmin);

      await expect(service.verifyEmail(rawToken)).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendVerificationLink', () => {
    it('should resend verification email for unverified admin', async () => {
      const mockAdmin = {
        id: 2,
        email: 'admin@eroxii.com',
        is_verified: 0,
      };

      adminUserRepositoryMock.findOne.mockResolvedValue(mockAdmin);

      const result = await service.resendVerificationLink('admin@eroxii.com');
      expect(result.success).toBe(true);
      expect(mailServiceMock.sendVerificationEmail).toHaveBeenCalledWith(
        'admin@eroxii.com',
        expect.any(String),
      );
    });

    it('should throw BadRequestException if account is already verified', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue({
        id: 2,
        email: 'admin@eroxii.com',
        is_verified: 1,
      });

      await expect(service.resendVerificationLink('admin@eroxii.com')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if email does not exist', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.resendVerificationLink('notfound@eroxii.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

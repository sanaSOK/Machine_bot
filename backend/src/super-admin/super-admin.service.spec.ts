import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { AdminUser } from '../users/admin-user.entity';
import { User } from '../users/user.entity';
import { Attendance } from '../attendance/attendance.entity';
import { AdminRole } from '../common/decorators/roles.decorator';
import { PasswordUtil } from '../common/utils/password.util';

import { MailService } from '../mail/mail.service';

describe('SuperAdminService', () => {
  let service: SuperAdminService;
  let adminUserRepositoryMock: any;
  let userRepositoryMock: any;
  let attendanceRepositoryMock: any;
  let mailServiceMock: any;

  beforeEach(async () => {
    mailServiceMock = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    adminUserRepositoryMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 10, ...entity, created_at: new Date(), updated_at: new Date() })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(0),
    };

    userRepositoryMock = {
      count: jest.fn().mockResolvedValue(5),
    };

    attendanceRepositoryMock = {
      count: jest.fn().mockResolvedValue(10),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminService,
        {
          provide: getRepositoryToken(AdminUser),
          useValue: adminUserRepositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
        {
          provide: getRepositoryToken(Attendance),
          useValue: attendanceRepositoryMock,
        },
        {
          provide: MailService,
          useValue: mailServiceMock,
        },
      ],
    }).compile();

    service = module.get<SuperAdminService>(SuperAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAdmin', () => {
    it('should successfully create an Admin account with role = 2 and hashed password', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue(null);

      const result = await service.createAdmin({
        fullname: 'Branch Admin',
        email: 'branch@eroxii.com',
        password: 'Password123!',
      });

      expect(result).toBeDefined();
      expect(result.email).toBe('branch@eroxii.com');
      expect(result.fullname).toBe('Branch Admin');
      expect(result.role).toBe(AdminRole.ADMIN);
      expect((result as any).password).toBeUndefined(); // Password must not be returned

      // Verify save was called with hashed password and verification token
      const savedArg = adminUserRepositoryMock.save.mock.calls[0][0];
      expect(savedArg.role).toBe(2);
      expect(savedArg.is_verified).toBe(0);
      expect(savedArg.verification_token_hash).toBeDefined();
      expect(savedArg.verification_expires).toBeDefined();
      expect(PasswordUtil.verifyPassword('Password123!', savedArg.password)).toBe(true);
      expect(mailServiceMock.sendVerificationEmail).toHaveBeenCalledWith(
        'branch@eroxii.com',
        expect.any(String),
      );
    });

    it('should throw ConflictException if admin with same email already exists', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue({ id: 1, email: 'existing@eroxii.com' });

      await expect(
        service.createAdmin({
          fullname: 'Existing Admin',
          email: 'existing@eroxii.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteAdmin', () => {
    it('should throw ConflictException when trying to delete a Super Admin', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue({
        id: 1,
        email: 'superadmin@eroxii.com',
        role: AdminRole.SUPER_ADMIN,
      });

      await expect(service.deleteAdmin(1)).rejects.toThrow(ConflictException);
    });

    it('should successfully delete an Admin account', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue({
        id: 2,
        email: 'admin@eroxii.com',
        role: AdminRole.ADMIN,
      });

      const res = await service.deleteAdmin(2);
      expect(res.success).toBe(true);
      expect(adminUserRepositoryMock.delete).toHaveBeenCalledWith(2);
    });
  });

  describe('updateAdminStatus', () => {
    it('should successfully update an Admin status to inactive (2)', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue({
        id: 2,
        email: 'admin@eroxii.com',
        role: AdminRole.ADMIN,
        is_active: 1,
      });

      const result = await service.updateAdminStatus(2, 2);
      expect(result.id).toBe(2);
      expect(result.is_active).toBe(2);
      expect(adminUserRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 2, is_active: 2 }),
      );
    });

    it('should throw ConflictException when attempting to change status of a Super Admin', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue({
        id: 1,
        email: 'superadmin@eroxii.com',
        role: AdminRole.SUPER_ADMIN,
        is_active: 1,
      });

      await expect(service.updateAdminStatus(1, 2)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if admin does not exist', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.updateAdminStatus(999, 2)).rejects.toThrow(NotFoundException);
    });
  });
});


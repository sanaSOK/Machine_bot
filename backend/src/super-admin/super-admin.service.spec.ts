import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { AdminUser } from '../users/admin-user.entity';
import { User } from '../users/user.entity';
import { Attendance } from '../attendance/attendance.entity';
import { Branch } from '../branches/branch.entity';
import { AdminRole } from '../common/decorators/roles.decorator';
import { MailService } from '../mail/mail.service';

describe('SuperAdminService', () => {
  let service: SuperAdminService;
  let adminUserRepositoryMock: any;
  let userRepositoryMock: any;
  let attendanceRepositoryMock: any;
  let branchRepositoryMock: any;
  let mailServiceMock: any;
  let queryRunnerMock: any;
  let dataSourceMock: any;

  beforeEach(async () => {
    mailServiceMock = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    queryRunnerMock = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        create: jest.fn().mockImplementation((entityClass, dto) => ({ ...dto })),
        save: jest.fn().mockImplementation((entity) =>
          Promise.resolve({ id: 10, ...entity, created_at: new Date(), updated_at: new Date() }),
        ),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        findOne: jest.fn(),
      },
    };

    dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
    };

    adminUserRepositoryMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) =>
        Promise.resolve({ id: 10, ...entity, created_at: new Date(), updated_at: new Date() }),
      ),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(0),
    };

    userRepositoryMock = {
      count: jest.fn().mockResolvedValue(5),
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      }),
    };

    attendanceRepositoryMock = {
      count: jest.fn().mockResolvedValue(10),
    };

    branchRepositoryMock = {
      count: jest.fn().mockResolvedValue(1),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 1, ...entity })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
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
          provide: getRepositoryToken(Branch),
          useValue: branchRepositoryMock,
        },
        {
          provide: MailService,
          useValue: mailServiceMock,
        },
      ],
    }).compile();

    service = module.get<SuperAdminService>(SuperAdminService);
  });

  describe('createAdmin', () => {
    it('should successfully create an Admin account assigned to an existing branch_id and sync branch.admin_id', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue(null);
      const mockBranch = { id: 3, name: 'Siem Reap Branch', admin_id: null };
      queryRunnerMock.manager.findOne
        .mockResolvedValueOnce(mockBranch) // branch found
        .mockResolvedValueOnce(null); // not assigned yet

      const result = await service.createAdmin({
        fullname: 'SR Admin',
        email: 'sradmin@eroxii.com',
        password: 'Password123!',
        branch_id: 3,
      });

      expect(result).toBeDefined();
      expect(result.email).toBe('sradmin@eroxii.com');
      expect(result.branch_id).toBe(3);
      expect(mockBranch.admin_id).toBe(10); // synced!
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(mailServiceMock.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw NotFoundException if branch_id does not exist', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue(null);
      queryRunnerMock.manager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.createAdmin({
          fullname: 'SR Admin',
          email: 'sradmin@eroxii.com',
          password: 'Password123!',
          branch_id: 999,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if existing branch is already assigned', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue(null);
      queryRunnerMock.manager.findOne
        .mockResolvedValueOnce({ id: 3, name: 'Siem Reap Branch', admin_id: 9 }) // branch already assigned
        .mockResolvedValueOnce({ id: 9, email: 'other@eroxii.com' });

      await expect(
        service.createAdmin({
          fullname: 'SR Admin',
          email: 'sradmin@eroxii.com',
          password: 'Password123!',
          branch_id: 3,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if admin with same email already exists', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue({ id: 1, email: 'existing@eroxii.com' });

      await expect(
        service.createAdmin({
          fullname: 'Existing Admin',
          email: 'existing@eroxii.com',
          password: 'Password123!',
          branch_id: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully create an Admin account with telegram_chat_id', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue(null);
      const mockBranch = { id: 3, name: 'Siem Reap Branch', admin_id: null };
      queryRunnerMock.manager.findOne
        .mockResolvedValueOnce(mockBranch) // branch found
        .mockResolvedValueOnce(null) // branch not assigned
        .mockResolvedValueOnce(null); // telegram_chat_id not assigned

      const result = await service.createAdmin({
        fullname: 'Kampot Manager',
        email: 'kampot@eroxii.com',
        password: 'Password123!',
        branch_id: 3,
        telegram_chat_id: 123456789,
      });

      expect(result).toBeDefined();
      expect(result.email).toBe('kampot@eroxii.com');
      expect(result.telegram_chat_id).toBe('123456789');
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if telegram_chat_id is already assigned to another admin', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue(null);
      const mockBranch = { id: 3, name: 'Siem Reap Branch', admin_id: null };
      queryRunnerMock.manager.findOne
        .mockResolvedValueOnce(mockBranch) // branch found
        .mockResolvedValueOnce(null) // branch not assigned
        .mockResolvedValueOnce({ id: 8, telegram_chat_id: '123456789' }); // telegram_chat_id already exists

      await expect(
        service.createAdmin({
          fullname: 'Kampot Manager',
          email: 'kampot@eroxii.com',
          password: 'Password123!',
          branch_id: 3,
          telegram_chat_id: 123456789,
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

    it('should successfully delete an Admin account and unlink branch without deleting branch', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue({
        id: 2,
        email: 'admin@eroxii.com',
        role: AdminRole.ADMIN,
        branch_id: 5,
      });

      const res = await service.deleteAdmin(2);
      expect(res.success).toBe(true);
      expect(queryRunnerMock.manager.update).toHaveBeenCalledWith(Branch, 5, { admin_id: null });
      expect(queryRunnerMock.manager.delete).toHaveBeenCalledWith(AdminUser, 2);
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
    });
  });
});


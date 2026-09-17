import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { Branch } from './branch.entity';
import { AdminUser } from '../users/admin-user.entity';
import { User } from '../users/user.entity';
import { Department } from '../admin/department.entity';
import { AdminRole } from '../common/decorators/roles.decorator';

describe('BranchesService', () => {
  let service: BranchesService;
  let branchRepositoryMock: any;
  let adminUserRepositoryMock: any;
  let userRepositoryMock: any;
  let departmentRepositoryMock: any;
  let queryRunnerMock: any;
  let dataSourceMock: any;

  beforeEach(async () => {
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

    branchRepositoryMock = {
      count: jest.fn().mockResolvedValue(1),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 1, ...entity })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
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
    };

    departmentRepositoryMock = {
      count: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: branchRepositoryMock,
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
          provide: getRepositoryToken(Department),
          useValue: departmentRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
  });

  describe('createBranch', () => {
    it('should successfully create a branch with default General department', async () => {
      branchRepositoryMock.findOne.mockResolvedValue(null);

      const res = await service.createBranch({
        name: 'Battambang Branch',
        address: 'Battambang City',
      });

      expect(res).toBeDefined();
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if branch name already exists', async () => {
      branchRepositoryMock.findOne.mockResolvedValue({ id: 1, name: 'Battambang Branch' });

      await expect(
        service.createBranch({
          name: 'Battambang Branch',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('assignBranch', () => {
    it('should reassign admin to branch successfully and sync branch.admin_id', async () => {
      adminUserRepositoryMock.findOne
        .mockResolvedValueOnce({ id: 5, role: AdminRole.ADMIN, branch_id: 1 }) // target admin
        .mockResolvedValueOnce(null); // branch is free in users table

      const targetBranch = { id: 2, name: 'Siem Reap Branch', admin_id: null };
      branchRepositoryMock.findOne.mockResolvedValue(targetBranch);

      const result = await service.assignBranch(5, 2);
      expect(result).toBeDefined();
      expect(targetBranch.admin_id).toBe(5);
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if branch is already assigned to someone else', async () => {
      adminUserRepositoryMock.findOne
        .mockResolvedValueOnce({ id: 5, role: AdminRole.ADMIN, branch_id: 1 })
        .mockResolvedValueOnce({ id: 8, email: 'occupant@eroxii.com' }); // occupied by id 8

      branchRepositoryMock.findOne.mockResolvedValue({ id: 2, name: 'Siem Reap Branch', admin_id: 8 });

      await expect(service.assignBranch(5, 2)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if admin or branch not found', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue(null);
      await expect(service.assignBranch(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBranch', () => {
    it('should update branch details successfully', async () => {
      const mockBranch = { id: 2, name: 'Old Name', address: null, phone: null, is_active: 1 };
      branchRepositoryMock.findOne.mockResolvedValue(mockBranch);

      const result = await service.updateBranch(2, { name: 'New Name' });
      expect(result.name).toBe('New Name');
      expect(branchRepositoryMock.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if branch to update not found', async () => {
      branchRepositoryMock.findOne.mockResolvedValue(null);
      await expect(service.updateBranch(999, { name: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteBranch', () => {
    it('should throw ConflictException when trying to delete Head Office (id = 1)', async () => {
      branchRepositoryMock.findOne.mockResolvedValue({ id: 1, name: 'Head Office' });
      await expect(service.deleteBranch(1)).rejects.toThrow(ConflictException);
    });

    it('should delete branch and unlink admin successfully', async () => {
      branchRepositoryMock.findOne.mockResolvedValue({ id: 2, name: 'Branch 2', admin_id: 5 });
      const res = await service.deleteBranch(2);
      expect(res.success).toBe(true);
      expect(queryRunnerMock.manager.update).toHaveBeenCalledWith(AdminUser, 5, { branch_id: null });
      expect(queryRunnerMock.manager.delete).toHaveBeenCalledWith(Branch, 2);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { Department } from './department.entity';
import { User } from '../users/user.entity';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let departmentRepositoryMock: any;
  let userRepositoryMock: any;

  beforeEach(async () => {
    departmentRepositoryMock = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((dto) => ({ id: 1, ...dto, createdAt: new Date(), updatedAt: new Date() })),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(0),
    };

    userRepositoryMock = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn((u) => Promise.resolve(u)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        {
          provide: getRepositoryToken(Department),
          useValue: departmentRepositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDepartments', () => {
    it('should return an empty array when no departments have been created yet (no static defaults)', async () => {
      departmentRepositoryMock.find.mockResolvedValue([]);
      userRepositoryMock.find.mockResolvedValue([]);

      const result = await service.getDepartments({ role: 'SUPER_ADMIN' }, 1);
      expect(result).toEqual([]);
      expect(departmentRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('should return created departments with user counts', async () => {
      departmentRepositoryMock.find.mockResolvedValue([
        { id: 10, name: 'ENGINEERING', description: 'Software devs', color: '#10b981', createdAt: new Date() },
      ]);
      userRepositoryMock.find.mockResolvedValue([
        { id: 1, role: 'ENGINEERING' },
        { id: 2, role: 'ENGINEERING' },
      ]);

      const result = await service.getDepartments({ role: 'SUPER_ADMIN' }, 1);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('ENGINEERING');
      expect(result[0].userCount).toBe(2);
    });
  });

  describe('createDepartment', () => {
    it('should create a custom department with clean uppercase name', async () => {
      departmentRepositoryMock.findOne.mockResolvedValue(null);

      const dto = { name: 'Marketing', description: 'Growth team' };
      const result = await service.createDepartment({ role: 'SUPER_ADMIN' }, dto);

      expect(departmentRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'MARKETING',
          description: 'Growth team',
          branch_id: 1,
        }),
      );
      expect(departmentRepositoryMock.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if department name already exists in the same branch', async () => {
      departmentRepositoryMock.findOne.mockResolvedValue({ id: 5, name: 'MARKETING', branch_id: 1 });

      const dto = { name: 'Marketing' };
      await expect(service.createDepartment({ role: 'SUPER_ADMIN' }, dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('ensureDepartmentExists', () => {
    it('should create and return new department if not existing', async () => {
      departmentRepositoryMock.findOne.mockResolvedValue(null);

      const result = await service.ensureDepartmentExists('FINANCE', 1);
      expect(departmentRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'FINANCE',
          description: 'FINANCE Department',
          branch_id: 1,
        }),
      );
      expect(result.name).toBe('FINANCE');
    });

    it('should return existing department if already exists', async () => {
      const existing = { id: 2, name: 'FINANCE', branch_id: 1 };
      departmentRepositoryMock.findOne.mockResolvedValue(existing);

      const result = await service.ensureDepartmentExists('FINANCE', 1);
      expect(result).toBe(existing);
      expect(departmentRepositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteDepartment', () => {
    it('should delete department by id', async () => {
      departmentRepositoryMock.findOne.mockResolvedValue({ id: 10, branch_id: 1 });

      await service.deleteDepartment({ role: 'SUPER_ADMIN' }, '10');
      expect(departmentRepositoryMock.delete).toHaveBeenCalledWith({ id: 10 });
    });
  });
});

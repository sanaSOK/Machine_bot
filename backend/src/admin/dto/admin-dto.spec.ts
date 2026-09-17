import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  BranchQueryDto,
  AdminAttendanceQueryDto,
  AdminEmployeeQueryDto,
  UpdateRoleDto,
  ToggleStatusDto,
  UpdateUserDto,
} from './index';

describe('Admin DTOs Validation & Transformation', () => {
  describe('BranchQueryDto', () => {
    it('should transform numeric string to number', async () => {
      const dto = plainToInstance(BranchQueryDto, { branch_id: '5' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.branch_id).toBe(5);
    });

    it('should transform "NaN", "undefined", "null", and "" to undefined', async () => {
      for (const val of ['NaN', 'undefined', 'null', '', null, undefined]) {
        const dto = plainToInstance(BranchQueryDto, { branch_id: val });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
        expect(dto.branch_id).toBeUndefined();
      }
    });

    it('should fail validation when non-numeric string is passed', async () => {
      const dto = plainToInstance(BranchQueryDto, { branch_id: 'invalid-branch' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'branch_id')).toBe(true);
    });
  });

  describe('AdminAttendanceQueryDto', () => {
    it('should accept valid attendance query parameters', async () => {
      const dto = plainToInstance(AdminAttendanceQueryDto, {
        search: 'Pheara',
        type: 'CHECK_IN',
        date: '2026-09-17',
        status: 'PRESENT',
        limit: '25',
        offset: '50',
        branch_id: '2',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.type).toBe('CHECK_IN');
      expect(dto.limit).toBe(25);
      expect(dto.offset).toBe(50);
      expect(dto.branch_id).toBe(2);
    });

    it('should transform empty strings for optional filters to undefined', async () => {
      const dto = plainToInstance(AdminAttendanceQueryDto, {
        type: '',
        status: '',
        date: '',
        search: '',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.type).toBeUndefined();
      expect(dto.status).toBeUndefined();
      expect(dto.date).toBeUndefined();
      expect(dto.search).toBeUndefined();
    });

    it('should reject invalid action enum value', async () => {
      const dto = plainToInstance(AdminAttendanceQueryDto, {
        type: 'INVALID_ACTION',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'type')).toBe(true);
    });
  });

  describe('AdminEmployeeQueryDto', () => {
    it('should accept valid employee query parameters', async () => {
      const dto = plainToInstance(AdminEmployeeQueryDto, {
        search: 'John',
        department: 'IT',
        role: 'ADMIN',
        limit: '15',
        offset: '0',
        branch_id: '1',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(15);
      expect(dto.offset).toBe(0);
      expect(dto.branch_id).toBe(1);
    });

    it('should fail when limit is less than 1', async () => {
      const dto = plainToInstance(AdminEmployeeQueryDto, {
        limit: '0',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'limit')).toBe(true);
    });
  });

  describe('UpdateRoleDto', () => {
    it('should pass with valid role string', async () => {
      const dto = plainToInstance(UpdateRoleDto, { role: 'MANAGER' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail with empty role', async () => {
      const dto = plainToInstance(UpdateRoleDto, { role: '' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'role')).toBe(true);
    });
  });

  describe('ToggleStatusDto', () => {
    it('should pass with boolean is_active', async () => {
      const dto = plainToInstance(ToggleStatusDto, { is_active: false });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.is_active).toBe(false);
    });
  });

  describe('UpdateUserDto', () => {
    it('should pass with partial fields and handle branch_id transform', async () => {
      const dto = plainToInstance(UpdateUserDto, {
        first_name: 'Alice',
        is_active: true,
        branch_id: '3',
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.branch_id).toBe(3);
      expect(dto.first_name).toBe('Alice');
    });
  });
});

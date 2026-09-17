import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SettingsService } from './settings.service';
import { ReportsService } from './reports.service';
import { DepartmentsService } from '../departments/departments.service';
import {
  BranchQueryDto,
  AdminAttendanceQueryDto,
  AdminEmployeeQueryDto,
  UpdateUserDto,
  UpdateRoleDto,
  ToggleStatusDto,
} from './dto';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: Partial<Record<keyof AdminService, jest.Mock>>;
  let departmentsService: Partial<Record<keyof DepartmentsService, jest.Mock>>;
  let settingsService: Partial<Record<keyof SettingsService, jest.Mock>>;
  let reportsService: Partial<Record<keyof ReportsService, jest.Mock>>;

  const mockUser = { id: 1, role: 'SUPER_ADMIN', branch_id: 1 };

  beforeEach(async () => {
    adminService = {
      getStats: jest.fn().mockResolvedValue({ totalEmployees: 10 }),
      getEmployees: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getAttendanceLogs: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getUserDetails: jest.fn().mockResolvedValue({ user: {} }),
      updateUserRole: jest.fn().mockResolvedValue({ id: 2, role: 'MANAGER' }),
      toggleUserStatus: jest.fn().mockResolvedValue({ id: 2, is_active: false }),
      updateUser: jest.fn().mockResolvedValue({ id: 2, first_name: 'Updated' }),
      deleteUser: jest.fn().mockResolvedValue({ success: true }),
    };

    departmentsService = {
      getDepartments: jest.fn().mockResolvedValue([]),
      createDepartment: jest.fn().mockResolvedValue({ id: 1 }),
      updateDepartment: jest.fn().mockResolvedValue({ id: 1 }),
      deleteDepartment: jest.fn().mockResolvedValue({ success: true }),
    };

    settingsService = {
      getSettings: jest.fn().mockReturnValue({}),
      updateSettings: jest.fn().mockReturnValue({}),
      updateLogo: jest.fn().mockResolvedValue({}),
    };

    reportsService = {
      exportExcel: jest.fn().mockResolvedValue(Buffer.from('')),
      sendDailySummaryReport: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: adminService },
        { provide: DepartmentsService, useValue: departmentsService },
        { provide: SettingsService, useValue: settingsService },
        { provide: ReportsService, useValue: reportsService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call adminService.getStats with branch_id from BranchQueryDto', async () => {
    const query: BranchQueryDto = { branch_id: 3 };
    await controller.getStats({ user: mockUser }, query);
    expect(adminService.getStats).toHaveBeenCalledWith(mockUser, 3);
  });

  it('should call departmentsService.getDepartments with branch_id from BranchQueryDto', async () => {
    const query: BranchQueryDto = { branch_id: 2 };
    await controller.getDepartments({ user: mockUser }, query);
    expect(departmentsService.getDepartments).toHaveBeenCalledWith(mockUser, 2);
  });

  it('should call adminService.getEmployees with AdminEmployeeQueryDto', async () => {
    const query: AdminEmployeeQueryDto = { search: 'Test', branch_id: 1, limit: 10, offset: 0 };
    await controller.getEmployees({ user: mockUser }, query);
    expect(adminService.getEmployees).toHaveBeenCalledWith(mockUser, query, 1);
  });

  it('should call adminService.getAttendanceLogs with AdminAttendanceQueryDto', async () => {
    const query: AdminAttendanceQueryDto = { type: 'CHECK_IN', branch_id: 1, limit: 50, offset: 0 };
    await controller.getAttendance({ user: mockUser }, query);
    expect(adminService.getAttendanceLogs).toHaveBeenCalledWith(mockUser, query, 1);
  });

  it('should call adminService.updateUserRole with UpdateRoleDto', async () => {
    const dto: UpdateRoleDto = { role: 'MANAGER' };
    await controller.updateUserRole({ user: mockUser }, 2, dto);
    expect(adminService.updateUserRole).toHaveBeenCalledWith(2, 'MANAGER', mockUser);
  });

  it('should call adminService.toggleUserStatus with ToggleStatusDto', async () => {
    const dto: ToggleStatusDto = { is_active: false };
    await controller.toggleUserStatus({ user: mockUser }, 2, dto);
    expect(adminService.toggleUserStatus).toHaveBeenCalledWith(2, false, mockUser);
  });

  it('should call adminService.updateUser with UpdateUserDto', async () => {
    const dto: UpdateUserDto = { first_name: 'Updated', branch_id: 2 };
    await controller.updateUser({ user: mockUser }, 2, dto);
    expect(adminService.updateUser).toHaveBeenCalledWith(2, dto, mockUser);
  });
});

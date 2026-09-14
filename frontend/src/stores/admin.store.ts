import { defineStore } from 'pinia';
import { ref } from 'vue';
import { adminApi } from '../services/admin.api';
import type {
  AdminStats,
  AdminAttendanceRecord,
  AdminUser,
  AdminAttendanceFilter,
  AdminEmployeeFilter,
  SystemSettings,
  DepartmentItem,
} from '../types/admin';

export const useAdminStore = defineStore('admin', () => {
  const stats = ref<AdminStats>({
    totalEmployees: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
  });

  const settings = ref<SystemSettings>({
    companyName: 'Eroxii Enterprise',
    logoUrl: '/logo.png',
    workStartTime: '08:00',
    workEndTime: '17:00',
    gracePeriodMinutes: 15,
    requireGps: true,
    requireDualPhoto: true,
    pageSize: 10,
  });

  const attendanceLogs = ref<AdminAttendanceRecord[]>([]);
  const totalLogs = ref<number>(0);
  const employees = ref<AdminUser[]>([]);
  const totalEmployeeRecords = ref<number>(0);
  const departments = ref<DepartmentItem[]>([]);

  const isLoadingStats = ref<boolean>(false);
  const isLoadingSettings = ref<boolean>(false);
  const isSavingSettings = ref<boolean>(false);
  const isUploadingLogo = ref<boolean>(false);
  const isLoadingEmployees = ref<boolean>(false);
  const isLoadingLogs = ref<boolean>(false);
  const isLoadingDepartments = ref<boolean>(false);
  const isCreatingDepartment = ref<boolean>(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const filters = ref<AdminAttendanceFilter>({
    search: '',
    type: '',
    date: '',
    status: '',
    limit: 10,
    offset: 0,
  });

  const employeeFilters = ref<AdminEmployeeFilter>({
    search: '',
    limit: 10,
    offset: 0,
  });

  const selectedRecord = ref<AdminAttendanceRecord | null>(null);
  const isPhotoModalOpen = ref<boolean>(false);

  async function fetchStats() {
    isLoadingStats.value = true;
    error.value = null;
    try {
      const res = await adminApi.getStats();
      if (res) {
        stats.value = {
          totalEmployees: res.totalEmployees || 0,
          todayCheckIns: res.todayCheckIns || 0,
          todayCheckOuts: res.todayCheckOuts || 0,
        };
      }
    } catch (err: any) {
      console.warn('Failed to fetch admin stats:', err);
      error.value = err.message || 'Failed to fetch admin stats';
    } finally {
      isLoadingStats.value = false;
    }
  }

  async function fetchSettings() {
    isLoadingSettings.value = true;
    error.value = null;
    try {
      const res = await adminApi.getSettings();
      if (res) {
        settings.value = { ...settings.value, ...res };
        if (res.pageSize) {
          filters.value.limit = res.pageSize;
          employeeFilters.value.limit = res.pageSize;
        }
      }
    } catch (err: any) {
      console.warn('Failed to fetch settings:', err);
      error.value = err.message || 'Failed to fetch system settings';
    } finally {
      isLoadingSettings.value = false;
    }
  }

  async function saveSettings(updated: Partial<SystemSettings>): Promise<boolean> {
    isSavingSettings.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const res = await adminApi.updateSettings(updated);
      settings.value = { ...settings.value, ...res };
      if (res.pageSize) {
        filters.value.limit = res.pageSize;
        employeeFilters.value.limit = res.pageSize;
      }
      successMessage.value = 'System settings updated successfully!';
      return true;
    } catch (err: any) {
      error.value = err.message || 'Failed to save settings';
      return false;
    } finally {
      isSavingSettings.value = false;
    }
  }

  async function uploadLogo(file: File): Promise<boolean> {
    isUploadingLogo.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const res = await adminApi.uploadLogo(file);
      if (res && res.logoUrl) {
        settings.value.logoUrl = res.logoUrl;
        successMessage.value = 'Company logo uploaded and updated successfully!';
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to upload logo';
      return false;
    } finally {
      isUploadingLogo.value = false;
    }
  }

  async function updateUserRole(userId: number, role: string): Promise<boolean> {
    error.value = null;
    successMessage.value = null;
    try {
      const updatedUser = await adminApi.updateUserRole(userId, role);
      if (updatedUser) {
        const target = employees.value.find((e) => e.id === userId);
        if (target) {
          target.role = updatedUser.role;
        }
        successMessage.value = `Role updated to ${updatedUser.role} for ${updatedUser.first_name || 'user'}!`;
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to update user role';
      return false;
    }
  }

  async function toggleUserStatus(userId: number, is_active: boolean): Promise<boolean> {
    error.value = null;
    successMessage.value = null;
    try {
      const updatedUser = await adminApi.toggleUserStatus(userId, is_active);
      if (updatedUser) {
        const target = employees.value.find((e) => e.id === userId);
        if (target) {
          target.is_active = updatedUser.is_active;
        }
        successMessage.value = `User status updated to ${updatedUser.is_active ? 'ACTIVE' : 'DEACTIVATED'}!`;
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to toggle user status';
      return false;
    }
  }

  async function updateUser(userId: number, data: { first_name?: string; last_name?: string; username?: string; role?: string; address?: string; is_active?: boolean }): Promise<boolean> {
    error.value = null;
    successMessage.value = null;
    try {
      const updatedUser = await adminApi.updateUser(userId, data);
      if (updatedUser) {
        const index = employees.value.findIndex((e) => e.id === userId);
        if (index !== -1) {
          employees.value[index] = { ...employees.value[index], ...updatedUser };
        }
        successMessage.value = `User profile for ${updatedUser.first_name} updated successfully!`;
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to update user profile';
      return false;
    }
  }

  async function deleteUser(userId: number): Promise<boolean> {
    error.value = null;
    successMessage.value = null;
    try {
      const res = await adminApi.deleteUser(userId);
      if (res && res.success) {
        employees.value = employees.value.filter((e) => e.id !== userId);
        totalEmployeeRecords.value = Math.max(0, totalEmployeeRecords.value - 1);
        successMessage.value = res.message || 'User deleted successfully!';
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to delete user';
      return false;
    }
  }

  async function fetchUserDetails(userId: number): Promise<{ user: AdminUser; totalLogs: number; recentLogs: any[] } | null> {
    error.value = null;
    try {
      return await adminApi.getUserDetails(userId);
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch user details';
      return null;
    }
  }

  async function fetchAttendanceLogs() {
    isLoadingLogs.value = true;
    error.value = null;
    try {
      const res = await adminApi.getAttendanceLogs(filters.value);
      if (res && Array.isArray(res.data)) {
        attendanceLogs.value = res.data;
        totalLogs.value = res.total || 0;
      } else {
        attendanceLogs.value = [];
        totalLogs.value = 0;
      }
    } catch (err: any) {
      console.warn('Failed to fetch attendance logs:', err);
      error.value = err.message || 'Failed to fetch attendance records';
      attendanceLogs.value = [];
      totalLogs.value = 0;
    } finally {
      isLoadingLogs.value = false;
    }
  }

  async function fetchEmployees() {
    isLoadingEmployees.value = true;
    error.value = null;
    try {
      const res = await adminApi.getEmployees(employeeFilters.value);
      if (res && Array.isArray(res.data)) {
        employees.value = res.data;
        totalEmployeeRecords.value = res.total || 0;
      } else {
        employees.value = [];
        totalEmployeeRecords.value = 0;
      }
    } catch (err: any) {
      console.warn('Failed to fetch employees:', err);
      error.value = err.message || 'Failed to fetch employee list';
      employees.value = [];
      totalEmployeeRecords.value = 0;
    } finally {
      isLoadingEmployees.value = false;
    }
  }

  function openPhotoModal(record: AdminAttendanceRecord) {
    selectedRecord.value = record;
    isPhotoModalOpen.value = true;
  }

  function closePhotoModal() {
    selectedRecord.value = null;
    isPhotoModalOpen.value = false;
  }

  function resetFilters() {
    filters.value = {
      search: '',
      type: '',
      date: '',
      status: '',
      limit: settings.value.pageSize || 10,
      offset: 0,
    };
    fetchAttendanceLogs();
  }

  function setPage(page: number) {
    filters.value.offset = (page - 1) * filters.value.limit;
    fetchAttendanceLogs();
  }

  function setEmployeePage(page: number) {
    employeeFilters.value.offset = (page - 1) * employeeFilters.value.limit;
    fetchEmployees();
  }

  async function fetchDepartments() {
    isLoadingDepartments.value = true;
    error.value = null;
    try {
      const res = await adminApi.getDepartments();
      if (Array.isArray(res)) {
        departments.value = res;
      }
    } catch (err: any) {
      console.warn('Failed to fetch departments:', err);
      error.value = err.message || 'Failed to fetch departments';
    } finally {
      isLoadingDepartments.value = false;
    }
  }

  async function createDepartment(dto: { name: string; description?: string; color?: string }): Promise<boolean> {
    isCreatingDepartment.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const res = await adminApi.createDepartment(dto);
      if (Array.isArray(res)) {
        departments.value = res;
        successMessage.value = `Department "${dto.name.toUpperCase()}" created successfully!`;
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to create department';
      return false;
    } finally {
      isCreatingDepartment.value = false;
    }
  }

  async function deleteDepartment(id: string): Promise<boolean> {
    error.value = null;
    successMessage.value = null;
    try {
      const res = await adminApi.deleteDepartment(id);
      if (Array.isArray(res)) {
        departments.value = res;
        successMessage.value = 'Department removed successfully!';
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to delete department';
      return false;
    }
  }

  async function updateDepartment(id: string, dto: { name?: string; description?: string; color?: string }): Promise<boolean> {
    error.value = null;
    successMessage.value = null;
    try {
      const res = await adminApi.updateDepartment(id, dto);
      if (Array.isArray(res)) {
        departments.value = res;
        successMessage.value = 'Department updated successfully!';
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to update department';
      return false;
    }
  }

  return {
    stats,
    settings,
    attendanceLogs,
    totalLogs,
    employees,
    totalEmployeeRecords,
    departments,
    isLoadingStats,
    isLoadingSettings,
    isSavingSettings,
    isUploadingLogo,
    isLoadingLogs,
    isLoadingEmployees,
    isLoadingDepartments,
    isCreatingDepartment,
    error,
    successMessage,
    filters,
    employeeFilters,
    selectedRecord,
    isPhotoModalOpen,
    fetchStats,
    fetchSettings,
    saveSettings,
    uploadLogo,
    updateUserRole,
    toggleUserStatus,
    updateUser,
    deleteUser,
    fetchUserDetails,
    fetchAttendanceLogs,
    fetchEmployees,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    openPhotoModal,
    closePhotoModal,
    resetFilters,
    setPage,
    setEmployeePage,
  };
});

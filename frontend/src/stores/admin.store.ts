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

  const isLoadingStats = ref<boolean>(false);
  const isLoadingSettings = ref<boolean>(false);
  const isSavingSettings = ref<boolean>(false);
  const isUploadingLogo = ref<boolean>(false);
  const isLoadingEmployees = ref<boolean>(false);
  const isLoadingLogs = ref<boolean>(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  const filters = ref<AdminAttendanceFilter>({
    search: '',
    type: '',
    date: '',
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

  return {
    stats,
    settings,
    attendanceLogs,
    totalLogs,
    employees,
    totalEmployeeRecords,
    isLoadingStats,
    isLoadingSettings,
    isSavingSettings,
    isUploadingLogo,
    isLoadingLogs,
    isLoadingEmployees,
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
    fetchAttendanceLogs,
    fetchEmployees,
    openPhotoModal,
    closePhotoModal,
    resetFilters,
    setPage,
    setEmployeePage,
  };
});

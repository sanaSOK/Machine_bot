import { defineStore } from 'pinia';
import { ref } from 'vue';
import { superAdminApi } from '../services/super-admin.api';
import type { SuperAdminStats, AdminUser, CreateAdminDto } from '../types/super-admin';

export const useSuperAdminStore = defineStore('superAdmin', () => {
  const stats = ref<SuperAdminStats>({
    totalAdmins: 0,
    totalActiveStaff: 0,
    totalTodayCheckIns: 0,
  });

  const admins = ref<AdminUser[]>([]);

  const isLoadingStats = ref<boolean>(false);
  const isLoadingAdmins = ref<boolean>(false);
  const isCreatingAdmin = ref<boolean>(false);
  const isUpdatingStatus = ref<boolean>(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  async function fetchStats() {
    isLoadingStats.value = true;
    error.value = null;
    try {
      const res = await superAdminApi.getStats();
      if (res) {
        stats.value = res;
      }
    } catch (err: any) {
      console.warn('Failed to fetch super admin stats:', err);
      error.value = err.message || 'Failed to fetch super admin stats';
    } finally {
      isLoadingStats.value = false;
    }
  }

  async function fetchAdmins(status?: number) {
    isLoadingAdmins.value = true;
    error.value = null;
    try {
      const res = await superAdminApi.getAdmins(status);
      if (Array.isArray(res)) {
        admins.value = res;
      }
    } catch (err: any) {
      console.warn('Failed to fetch admins:', err);
      error.value = err.message || 'Failed to fetch admin accounts';
    } finally {
      isLoadingAdmins.value = false;
    }
  }

  async function createAdmin(dto: CreateAdminDto): Promise<boolean> {
    isCreatingAdmin.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const created = await superAdminApi.createAdmin(dto);
      if (created) {
        successMessage.value = `Admin account "${created.email}" created successfully! A verification link was sent to their email.`;
        await fetchAdmins();
        await fetchStats();
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to create admin account';
      return false;
    } finally {
      isCreatingAdmin.value = false;
    }
  }

  async function toggleAdminStatus(id: number, currentStatus: number): Promise<boolean> {
    isUpdatingStatus.value = true;
    error.value = null;
    successMessage.value = null;
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      const updated = await superAdminApi.updateAdminStatus(id, newStatus);
      if (updated) {
        successMessage.value = `Admin account status updated to ${newStatus === 1 ? 'Active' : 'Inactive'}!`;
        await fetchAdmins();
        await fetchStats();
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to update admin status';
      return false;
    } finally {
      isUpdatingStatus.value = false;
    }
  }

  async function deleteAdmin(id: number): Promise<boolean> {
    error.value = null;
    successMessage.value = null;
    try {
      const res = await superAdminApi.deleteAdmin(id);
      if (res && res.success) {
        successMessage.value = res.message || 'Admin account removed successfully!';
        await fetchAdmins();
        await fetchStats();
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to delete admin account';
      return false;
    }
  }

  return {
    stats,
    admins,
    isLoadingStats,
    isLoadingAdmins,
    isCreatingAdmin,
    isUpdatingStatus,
    error,
    successMessage,
    fetchStats,
    fetchAdmins,
    createAdmin,
    toggleAdminStatus,
    deleteAdmin,
  };
});

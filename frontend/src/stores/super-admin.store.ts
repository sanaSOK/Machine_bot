import { defineStore } from 'pinia';
import { ref } from 'vue';
import { superAdminApi } from '../services/super-admin.api';
import type { SuperAdminStats, AdminOrgItem } from '../types/super-admin';

export const useSuperAdminStore = defineStore('superAdmin', () => {
  const stats = ref<SuperAdminStats>({
    totalAdminOrgs: 0,
    activeAdminOrgs: 0,
    suspendedAdminOrgs: 0,
    totalSystemEmployees: 0,
    totalTodayCheckIns: 0,
  });

  const adminOrgs = ref<AdminOrgItem[]>([]);

  const isLoadingStats = ref<boolean>(false);
  const isLoadingOrgs = ref<boolean>(false);
  const isCreatingOrg = ref<boolean>(false);
  const isUpdatingOrg = ref<boolean>(false);
  const isUploadingOrgLogo = ref<boolean>(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  async function uploadOrgLogo(file: File): Promise<string | null> {
    isUploadingOrgLogo.value = true;
    error.value = null;
    try {
      const res = await superAdminApi.uploadOrgLogo(file);
      if (res && res.logoUrl) {
        successMessage.value = 'Organization logo uploaded successfully!';
        return res.logoUrl;
      }
      return null;
    } catch (err: any) {
      error.value = err.message || 'Failed to upload organization logo';
      return null;
    } finally {
      isUploadingOrgLogo.value = false;
    }
  }

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

  async function fetchAdminOrgs() {
    isLoadingOrgs.value = true;
    error.value = null;
    try {
      const res = await superAdminApi.getAdminOrgs();
      if (Array.isArray(res)) {
        adminOrgs.value = res;
      }
    } catch (err: any) {
      console.warn('Failed to fetch admin orgs:', err);
      error.value = err.message || 'Failed to fetch admin organizations';
    } finally {
      isLoadingOrgs.value = false;
    }
  }

  async function createAdminOrg(dto: Partial<AdminOrgItem>): Promise<boolean> {
    isCreatingOrg.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const res = await superAdminApi.createAdminOrg(dto);
      if (Array.isArray(res)) {
        adminOrgs.value = res;
        successMessage.value = `Admin Organization "${dto.companyName}" created successfully!`;
        fetchStats();
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to create admin organization';
      return false;
    } finally {
      isCreatingOrg.value = false;
    }
  }

  async function updateAdminOrg(id: string, dto: Partial<AdminOrgItem>): Promise<boolean> {
    isUpdatingOrg.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const res = await superAdminApi.updateAdminOrg(id, dto);
      if (Array.isArray(res)) {
        adminOrgs.value = res;
        successMessage.value = 'Admin Organization updated successfully!';
        fetchStats();
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to update admin organization';
      return false;
    } finally {
      isUpdatingOrg.value = false;
    }
  }

  async function toggleAdminStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<boolean> {
    error.value = null;
    successMessage.value = null;
    try {
      const res = await superAdminApi.toggleAdminStatus(id, status);
      if (Array.isArray(res)) {
        adminOrgs.value = res;
        successMessage.value = `Admin status changed to ${status}!`;
        fetchStats();
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to toggle admin status';
      return false;
    }
  }

  async function deleteAdminOrg(id: string): Promise<boolean> {
    error.value = null;
    successMessage.value = null;
    try {
      const res = await superAdminApi.deleteAdminOrg(id);
      if (Array.isArray(res)) {
        adminOrgs.value = res;
        successMessage.value = 'Admin Organization removed successfully!';
        fetchStats();
        return true;
      }
      return false;
    } catch (err: any) {
      error.value = err.message || 'Failed to delete admin organization';
      return false;
    }
  }

  return {
    stats,
    adminOrgs,
    isLoadingStats,
    isLoadingOrgs,
    isCreatingOrg,
    isUpdatingOrg,
    isUploadingOrgLogo,
    error,
    successMessage,
    uploadOrgLogo,
    fetchStats,
    fetchAdminOrgs,
    createAdminOrg,
    updateAdminOrg,
    toggleAdminStatus,
    deleteAdminOrg,
  };
});

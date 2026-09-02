import api from './api';
import type { SuperAdminStats, AdminOrgItem } from '../types/super-admin';

export const superAdminApi = {
  async getStats(): Promise<SuperAdminStats> {
    const response = await api.get<SuperAdminStats>('/super-admin/stats');
    return response.data;
  },

  async getAdminOrgs(): Promise<AdminOrgItem[]> {
    const response = await api.get<AdminOrgItem[]>('/super-admin/admins');
    return response.data;
  },

  async createAdminOrg(dto: Partial<AdminOrgItem>): Promise<AdminOrgItem[]> {
    const response = await api.post<AdminOrgItem[]>('/super-admin/admins', dto);
    return response.data;
  },

  async updateAdminOrg(id: string, dto: Partial<AdminOrgItem>): Promise<AdminOrgItem[]> {
    const response = await api.patch<AdminOrgItem[]>(`/super-admin/admins/${id}`, dto);
    return response.data;
  },

  async toggleAdminStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<AdminOrgItem[]> {
    const response = await api.patch<AdminOrgItem[]>(`/super-admin/admins/${id}/status`, { status });
    return response.data;
  },

  async deleteAdminOrg(id: string): Promise<AdminOrgItem[]> {
    const response = await api.delete<AdminOrgItem[]>(`/super-admin/admins/${id}`);
    return response.data;
  },
};

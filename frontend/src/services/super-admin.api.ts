import api from './api';
import type { SuperAdminStats, AdminUser, CreateAdminDto } from '../types/super-admin';

export const superAdminApi = {
  async getStats(): Promise<SuperAdminStats> {
    const response = await api.get<SuperAdminStats>('/super-admin/stats');
    return response.data;
  },

  async getAdmins(status?: number): Promise<AdminUser[]> {
    const params = status !== undefined ? { status } : {};
    const response = await api.get<AdminUser[]>('/super-admin/admins', { params });
    return response.data;
  },

  async createAdmin(dto: CreateAdminDto): Promise<AdminUser> {
    const response = await api.post<AdminUser>('/super-admin/admins', dto);
    return response.data;
  },

  async updateAdminStatus(id: number, is_active: number): Promise<AdminUser> {
    const response = await api.put<AdminUser>(`/super-admin/admins/${id}/status`, { is_active });
    return response.data;
  },

  async deleteAdmin(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/super-admin/admins/${id}`);
    return response.data;
  },
};

import api from './api';
import type {
  AdminStats,
  AdminAttendanceResponse,
  AdminAttendanceFilter,
  SystemSettings,
  AdminEmployeeFilter,
  AdminEmployeeResponse,
  AdminUser,
} from '../types/admin';

export const adminApi = {
  async getStats(): Promise<AdminStats> {
    const response = await api.get<AdminStats>('/admin/stats');
    return response.data;
  },

  async getSettings(): Promise<SystemSettings> {
    const response = await api.get<SystemSettings>('/admin/settings');
    return response.data;
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const response = await api.post<SystemSettings>('/admin/settings', settings);
    return response.data;
  },

  async uploadLogo(file: File): Promise<{ logoUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post<{ logoUrl: string; message: string }>('/admin/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateUserRole(userId: number, role: string): Promise<AdminUser> {
    const response = await api.patch<AdminUser>(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  async getAttendanceLogs(filter: Partial<AdminAttendanceFilter>): Promise<AdminAttendanceResponse> {
    const params = new URLSearchParams();
    if (filter.search) params.append('search', filter.search);
    if (filter.type) params.append('type', filter.type);
    if (filter.date) params.append('date', filter.date);
    if (filter.status) params.append('status', filter.status);
    if (filter.limit) params.append('limit', String(filter.limit));
    if (filter.offset) params.append('offset', String(filter.offset));

    const response = await api.get<AdminAttendanceResponse>(`/admin/attendance?${params.toString()}`);
    return response.data;
  },

  async getEmployees(filter?: Partial<AdminEmployeeFilter>): Promise<AdminEmployeeResponse> {
    const params = new URLSearchParams();
    if (filter?.search) params.append('search', filter.search);
    if (filter?.limit) params.append('limit', String(filter.limit));
    if (filter?.offset) params.append('offset', String(filter.offset));

    const response = await api.get<AdminEmployeeResponse>(`/admin/employees?${params.toString()}`);
    return response.data;
  },

  getExportCsvUrl(): string {
    const getApiBaseUrl = () => {
      if (typeof window !== 'undefined' && window.location && window.location.origin) {
        return `${window.location.origin}/api`;
      }
      return import.meta.env.VITE_API_URL || '/api';
    };
    return `${getApiBaseUrl()}/admin/export`;
  },
};

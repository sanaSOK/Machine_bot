import api from './api';

export interface AdminLoginDto {
  email: string;
  password?: string;
}

export interface AdminAuthResponse {
  accessToken: string;
  user: {
    id: number;
    fullname: string;
    email: string;
    role: number;
    profile_url: string | null;
  };
}

export const authApi = {
  async adminLogin(dto: AdminLoginDto): Promise<AdminAuthResponse> {
    const response = await api.post<AdminAuthResponse>('/auth/admin/login', dto);
    return response.data;
  },

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const response = await api.get<{ success: boolean; message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    return response.data;
  },

  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/auth/resend-verification', { email });
    return response.data;
  },
};

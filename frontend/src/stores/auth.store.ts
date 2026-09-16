import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../types/user';
import { waitForInitData, initializeTelegram, getInitData } from '../services/telegram';
import { authenticateTelegramApi } from '../services/attendance.service';
import { authApi, type AdminLoginDto } from '../services/auth.api';

export interface AdminSessionUser {
  id: number;
  fullname: string;
  email: string;
  role: number;
  profile_url: string | null;
}

function parseJwtPayload(jwtToken: string | null) {
  if (!jwtToken) return null;
  try {
    const base64Url = jwtToken.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(
    JSON.parse(localStorage.getItem('auth_user') || 'null')
  );
  const adminUser = ref<AdminSessionUser | null>(
    JSON.parse(localStorage.getItem('admin_session_user') || 'null')
  );
  const token = ref<string | null>(localStorage.getItem('auth_token'));
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const jwtPayload = computed(() => parseJwtPayload(token.value));

  const isAuthenticated = computed(() => !!token.value);
  const isSuperAdmin = computed(() => {
    if (!token.value) return false;
    if (adminUser.value && adminUser.value.role === 1) return true;
    if (jwtPayload.value && (jwtPayload.value.role === 1 || jwtPayload.value.role === '1')) return true;
    return false;
  });
  const isAdmin = computed(() => {
    if (!token.value) return false;
    if (adminUser.value && (adminUser.value.role === 1 || adminUser.value.role === 2)) return true;
    if (jwtPayload.value && (jwtPayload.value.type === 'admin' || jwtPayload.value.role === 1 || jwtPayload.value.role === 2)) return true;
    return true;
  });

  async function loginWithTelegram(customInitData?: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      initializeTelegram();
      let initData = customInitData || getInitData() || (await waitForInitData(3000));

      if (!initData) {
        const mockUser = {
          id: 5031318412,
          first_name: 'SANA',
          last_name: 'SOK',
          username: 'SAKIAYUU',
        };
        const authDate = Math.floor(Date.now() / 1000);
        initData = `auth_date=${authDate}&query_id=AAH_MOBILE_503&user=${encodeURIComponent(JSON.stringify(mockUser))}&hash=dev_mock_hash_for_testing`;
      }

      const res = await authenticateTelegramApi(initData);
      token.value = res.accessToken;
      user.value = res.user;

      localStorage.setItem('auth_token', res.accessToken);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
      return true;
    } catch (err: any) {
      error.value = err.message || 'Telegram authentication failed';
      logout();
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function loginAdmin(dto: AdminLoginDto): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const res = await authApi.adminLogin(dto);
      token.value = res.accessToken;
      adminUser.value = res.user;

      localStorage.setItem('auth_token', res.accessToken);
      localStorage.setItem('admin_session_user', JSON.stringify(res.user));
      return true;
    } catch (err: any) {
      error.value = err.message || 'Admin login failed';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    adminUser.value = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('admin_session_user');
  }

  return {
    user,
    adminUser,
    token,
    isLoading,
    error,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    loginWithTelegram,
    loginAdmin,
    logout,
  };
});

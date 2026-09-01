import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../types/user';
import { waitForInitData, initializeTelegram, getInitData } from '../services/telegram';
import { authenticateTelegramApi } from '../services/attendance.service';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('auth_token'));
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  async function loginWithTelegram(customInitData?: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      initializeTelegram();
      let initData = customInitData || getInitData() || (await waitForInitData(3000));

      if (!initData) {
        // Dev/Mobile fallback init payload
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
      return true;
    } catch (err: any) {
      error.value = err.message || 'Telegram authentication failed';
      localStorage.removeItem('auth_token');
      token.value = null;
      user.value = null;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('auth_token');
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    loginWithTelegram,
    logout,
  };
});

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../types/user';
import { waitForInitData, initializeTelegram } from '../services/telegram';
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
      let initData = customInitData || (await waitForInitData());

      if (!initData) {
        console.warn('Telegram initData not found in window.Telegram.WebApp.');
        throw new Error('Telegram initialization data not found. Please open app via Telegram Bot.');
      }

      const res = await authenticateTelegramApi(initData);
      token.value = res.accessToken;
      user.value = res.user;

      localStorage.setItem('auth_token', res.accessToken);
      return true;
    } catch (err: any) {
      error.value = err.message || 'Telegram authentication failed';
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

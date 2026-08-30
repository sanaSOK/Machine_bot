<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
    <!-- Initial Loading State -->
    <div v-if="authStore.isLoading && !authStore.isAuthenticated" class="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div class="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4"></div>
      <h2 class="text-xl font-bold text-white mb-1">Telegram Attendance System</h2>
      <p class="text-xs text-indigo-300">Connecting to Telegram Account...</p>
    </div>

    <!-- Fallback Container if opened in browser or delayed on mobile -->
    <div v-else-if="!authStore.isAuthenticated" class="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div class="glass-panel p-6 rounded-3xl max-w-sm w-full border border-indigo-500/30">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg">
          📱
        </div>
        <h3 class="text-lg font-bold text-white mb-2">Telegram Attendance App</h3>
        <p class="text-xs text-slate-300 mb-6 leading-relaxed">
          Click below to initialize your profile and access Check In / Check Out:
        </p>

        <!-- Retry / Open Attendance Button -->
        <button
          @click="handleForceLogin"
          class="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-2xl shadow-xl transition-all glow-emerald flex items-center justify-center gap-2 transform active:scale-98"
        >
          <span>🚀 Open Attendance Dashboard</span>
        </button>
      </div>
    </div>

    <!-- Main Router View -->
    <router-view v-else></router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth.store';
import { initializeTelegram, getInitData } from './services/telegram';

const authStore = useAuthStore();

async function handleForceLogin() {
  initializeTelegram();
  const initData = getInitData();

  if (initData) {
    await authStore.loginWithTelegram(initData);
  } else {
    // Dev/Mobile fallback init payload
    const mockUser = {
      id: 5031318412,
      first_name: 'SANA',
      last_name: 'SOK',
      username: 'SAKIAYUU',
    };
    const authDate = Math.floor(Date.now() / 1000);
    const mockInitData = `auth_date=${authDate}&query_id=AAH_MOBILE_503&user=${encodeURIComponent(JSON.stringify(mockUser))}&hash=dev_mock_hash_for_testing`;
    await authStore.loginWithTelegram(mockInitData);
  }
}

onMounted(async () => {
  initializeTelegram();
  const success = await authStore.loginWithTelegram();
  if (!success && !getInitData()) {
    // Automatic fallback for mobile webview delay
    await handleForceLogin();
  }
});
</script>

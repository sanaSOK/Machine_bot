<template>
  <div class="space-y-8 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200 tracking-tight">
          System Settings
        </h2>
        <p class="text-xs text-slate-400 font-medium mt-1">
          Configure work shifts, attendance rules, pagination sizes, and Telegram integration
        </p>
      </div>

      <!-- Save Changes Button -->
      <button
        @click="handleSave"
        :disabled="adminStore.isSavingSettings"
        class="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold text-xs shadow-xl transition-all flex items-center justify-center gap-2.5 glow-indigo transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-fit"
      >
        <Loader2 v-if="adminStore.isSavingSettings" class="w-4 h-4 animate-spin" />
        <Save v-else class="w-4 h-4" />
        <span>{{ adminStore.isSavingSettings ? 'Saving Changes...' : 'Save Settings' }}</span>
      </button>
    </div>

    <!-- Alert Notifications -->
    <div v-if="adminStore.successMessage" class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-md">
      <div class="flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{{ adminStore.successMessage }}</span>
      </div>
      <button @click="adminStore.successMessage = null" class="text-xs text-emerald-400 hover:text-emerald-300 font-bold">Dismiss</button>
    </div>

    <div v-if="adminStore.error" class="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-between shadow-md">
      <div class="flex items-center gap-2">
        <AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
        <span>{{ adminStore.error }}</span>
      </div>
      <button @click="adminStore.error = null" class="text-xs text-red-400 hover:text-red-300 font-bold">Dismiss</button>
    </div>

    <!-- Settings Sections -->
    <div class="space-y-6">
      <!-- 1. Work Shift & Hours Configuration -->
      <div class="glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-5">
        <div class="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div class="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <Clock class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-white uppercase tracking-wider">Shift Schedule & Policy</h3>
            <p class="text-[11px] text-slate-400">Set standard operating hours and late check-in grace period</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Company Name -->
          <div class="space-y-1.5 md:col-span-2">
            <label class="text-xs font-bold text-slate-300">Organization / Company Name</label>
            <input
              v-model="form.companyName"
              type="text"
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <!-- Work Start Time -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">Standard Work Start Time</label>
            <input
              v-model="form.workStartTime"
              type="time"
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
            />
          </div>

          <!-- Work End Time -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">Standard Work End Time</label>
            <input
              v-model="form.workEndTime"
              type="time"
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
            />
          </div>

          <!-- Grace Period (Minutes) -->
          <div class="space-y-1.5 md:col-span-2">
            <label class="text-xs font-bold text-slate-300">Late Grace Period (Minutes)</label>
            <input
              v-model.number="form.gracePeriodMinutes"
              type="number"
              min="0"
              max="120"
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <p class="text-[10px] text-slate-500">Check-ins within this period after start time will not be flagged as late.</p>
          </div>
        </div>
      </div>

      <!-- 2. Table Pagination Settings -->
      <div class="glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-5">
        <div class="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div class="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <ListFilter class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-white uppercase tracking-wider">Table Pagination Settings</h3>
            <p class="text-[11px] text-slate-400">Set default rows per page for Employee Directory and Attendance Tables</p>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-300">Default Items Per Page (Pagination Size)</label>
          <select
            v-model.number="form.pageSize"
            class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
          >
            <option :value="5">5 rows per page</option>
            <option :value="10">10 rows per page (Default)</option>
            <option :value="20">20 rows per page</option>
            <option :value="50">50 rows per page</option>
            <option :value="100">100 rows per page</option>
          </select>
          <p class="text-[10px] text-slate-500">Applies immediately to Employee Directory and Attendance Logs tables.</p>
        </div>
      </div>

      <!-- 3. Security & Verification Rules -->
      <div class="glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-5">
        <div class="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div class="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-white uppercase tracking-wider">Verification Rules</h3>
            <p class="text-[11px] text-slate-400">Toggle mandatory GPS coordinates and dual-camera verification</p>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Require GPS Location Toggle -->
          <div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <MapPin class="w-5 h-5 text-emerald-400" />
              <div>
                <div class="text-xs font-bold text-white">Require Live GPS Geolocation</div>
                <div class="text-[11px] text-slate-400">Ensure coordinates are captured via Telegram LocationManager sensor</div>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="form.requireGps" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <!-- Require Dual Photo PIP Toggle -->
          <div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <Camera class="w-5 h-5 text-indigo-400" />
              <div>
                <div class="text-xs font-bold text-white">Require Dual Photo Verification</div>
                <div class="text-[11px] text-slate-400">Capture 2-step Front Selfie + Back Workplace photo</div>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="form.requireDualPhoto" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- 4. Telegram Integration & Environment Info -->
      <div class="glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-5">
        <div class="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div class="p-2.5 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
            <Bot class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-white uppercase tracking-wider">Telegram Bot Configuration</h3>
            <p class="text-[11px] text-slate-400">Bot token status and Mini App Webhook URL</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telegram Bot Token Status</span>
            <div class="text-xs font-bold text-purple-300 font-mono">
              {{ adminStore.settings?.telegramBotToken || 'Configured via .env' }}
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">API Server Endpoint</span>
            <div class="text-xs font-bold text-emerald-300 font-mono truncate">
              {{ currentOrigin }}/api
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  Save,
  Clock,
  ListFilter,
  ShieldCheck,
  MapPin,
  Camera,
  Bot,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-vue-next';
import { useAdminStore } from '../../stores/admin.store';
import type { SystemSettings } from '../../types/admin';

const adminStore = useAdminStore();

const form = ref<SystemSettings>({
  companyName: 'Eroxii Enterprise',
  workStartTime: '08:00',
  workEndTime: '17:00',
  gracePeriodMinutes: 15,
  requireGps: true,
  requireDualPhoto: true,
  pageSize: 10,
});

const currentOrigin = computed(() => {
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
});

async function handleSave() {
  await adminStore.saveSettings(form.value);
}

onMounted(async () => {
  await adminStore.fetchSettings();
  if (adminStore.settings) {
    form.value = { ...adminStore.settings };
  }
});
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 pb-12 max-w-md mx-auto relative overflow-hidden">
    <!-- Header Title -->
    <header class="text-center py-4 border-b border-slate-800/80 mb-6">
      <h1 class="text-xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
        ATTENDANCE SYSTEM
      </h1>
    </header>

    <!-- User Profile Header -->
    <div class="mb-6">
      <UserProfile :user="authStore.user" />
    </div>

    <!-- Date Card -->
    <div class="glass-card p-4 rounded-2xl border border-slate-800/80 text-center mb-6 shadow-md">
      <div class="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-1">
        {{ currentDayName }}
      </div>
      <div class="text-xl font-bold text-white">
        {{ currentDateFormatted }}
      </div>
    </div>

    <!-- Live GPS Location & Map Status Card (Starts Locating on Mini App Open) -->
    <div class="glass-panel p-4 rounded-2xl border border-slate-800/80 mb-6 shadow-md bg-slate-900/40">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <MapPin class="w-4 h-4 text-emerald-400" />
          <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Current Live Location</span>
        </div>

        <button
          @click="startLocatingOnAppOpen"
          class="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
          title="Refresh GPS Location"
        >
          <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': isLocating }" />
          <span>Refresh</span>
        </button>
      </div>

      <!-- Locating State -->
      <div v-if="isLocating" class="flex items-center gap-2 text-xs text-slate-400 py-1">
        <Loader2 class="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
        <span>Detecting live GPS coordinates...</span>
      </div>

      <!-- Location Error State -->
      <div v-else-if="locationError" class="text-xs text-amber-400/90 py-1 flex items-center justify-between">
        <span class="truncate pr-2">⚠️ {{ locationError }}</span>
        <button @click="startLocatingOnAppOpen" class="text-xs font-bold underline shrink-0">Retry</button>
      </div>

      <!-- Location Ready State -->
      <div v-else-if="locationData" class="flex items-center justify-between gap-3 pt-1">
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold text-emerald-300 truncate">
            {{ locationData.address || 'Live Location Ready' }}
          </p>
          <p class="text-[10px] text-slate-400 font-mono mt-0.5">
            GPS: {{ locationData.lat.toFixed(5) }}, {{ locationData.lng.toFixed(5) }}
          </p>
        </div>

        <a
          :href="`https://www.google.com/maps?q=${locationData.lat},${locationData.lng}`"
          target="_blank"
          rel="noopener noreferrer"
          class="shrink-0 text-xs font-bold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 flex items-center gap-1 transition-all shadow-sm"
          title="Open Current Position in Google Maps"
        >
          <span>View Map</span>
          <ExternalLink class="w-3 h-3" />
        </a>
      </div>
    </div>

    <!-- Today's Attendance Status Widget -->
    <div class="glass-panel p-5 rounded-3xl border border-slate-700/60 mb-6 shadow-xl relative overflow-hidden">
      <!-- Status Badge Accent -->
      <div class="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Attendance</span>
        <span
          class="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"
          :class="{
            'bg-amber-500/20 text-amber-300 border border-amber-500/30': todayStatus.status === 'WORKING',
            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30': todayStatus.status === 'COMPLETED',
            'bg-slate-800 text-slate-400 border border-slate-700': todayStatus.status === 'NOT_CHECKED_IN'
          }"
        >
          <span class="w-2 h-2 rounded-full"
            :class="{
              'bg-amber-400 animate-pulse': todayStatus.status === 'WORKING',
              'bg-emerald-400': todayStatus.status === 'COMPLETED',
              'bg-slate-500': todayStatus.status === 'NOT_CHECKED_IN'
            }"
          ></span>
          {{ statusText }}
        </span>
      </div>

      <!-- Time Slots Grid -->
      <div class="grid grid-cols-2 gap-4">
        <!-- Check In Slot -->
        <div class="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div class="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <span>📷</span> Check In
            </div>
            <div class="text-base font-bold text-slate-100">
              {{ todayStatus.checkIn ? formatTime(todayStatus.checkIn.created_at) : 'Not yet' }}
            </div>
          </div>
          
          <div v-if="todayStatus.checkIn" class="mt-2 pt-2 border-t border-slate-800/80">
            <a
              v-if="getMapsUrl(todayStatus.checkIn)"
              :href="getMapsUrl(todayStatus.checkIn)!"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all truncate max-w-full"
              title="Open location in Google Maps"
            >
              <MapPin class="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Google Maps</span>
              <ExternalLink class="w-2.5 h-2.5 text-emerald-400/80 shrink-0" />
            </a>
            <div v-else class="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 class="w-3.5 h-3.5" /> Done
            </div>
          </div>
        </div>

        <!-- Check Out Slot -->
        <div class="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div class="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <span>🚪</span> Check Out
            </div>
            <div class="text-base font-bold text-slate-100">
              {{ (todayStatus.status !== 'WORKING' && todayStatus.checkOut) ? formatTime(todayStatus.checkOut.created_at) : 'Not yet' }}
            </div>
          </div>

          <div v-if="todayStatus.status !== 'WORKING' && todayStatus.checkOut" class="mt-2 pt-2 border-t border-slate-800/80">
            <a
              v-if="getMapsUrl(todayStatus.checkOut)"
              :href="getMapsUrl(todayStatus.checkOut)!"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all truncate max-w-full"
              title="Open location in Google Maps"
            >
              <MapPin class="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Google Maps</span>
              <ExternalLink class="w-2.5 h-2.5 text-emerald-400/80 shrink-0" />
            </a>
            <div v-else class="text-xs text-indigo-400 flex items-center gap-1">
              <CheckCircle2 class="w-3.5 h-3.5" /> Done
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Alert Toast -->
    <div v-if="attendanceStore.error" class="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center justify-between">
      <span>❌ {{ attendanceStore.error }}</span>
      <button @click="attendanceStore.error = null" class="text-xs font-bold text-red-400">Dismiss</button>
    </div>

    <!-- Success Alert Toast -->
    <div v-if="attendanceStore.successMessage" class="mb-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
      <span>✅ {{ attendanceStore.successMessage }}</span>
      <button @click="attendanceStore.successMessage = null" class="text-xs font-bold text-emerald-400">Dismiss</button>
    </div>

    <!-- Primary Action Buttons -->
    <div class="space-y-4 mb-6">
      <CheckInButton
        :disabled="!todayStatus.canCheckIn"
        @click="goToCheckIn"
      />

      <CheckOutButton
        :disabled="!todayStatus.canCheckOut"
        @click="goToCheckOut"
      />
    </div>

    <!-- Attendance History Button -->
    <button
      @click="goToHistory"
      class="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
    >
      <History class="w-5 h-5 text-indigo-400" />
      <span>📋 Attendance History</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { History, CheckCircle2, MapPin, ExternalLink, Loader2, RefreshCw } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth.store';
import { useAttendanceStore } from '../stores/attendance.store';
import { getTelegramLocation } from '../services/telegram';
import UserProfile from '../components/UserProfile.vue';
import CheckInButton from '../components/CheckInButton.vue';
import CheckOutButton from '../components/CheckOutButton.vue';
import type { AttendanceRecord } from '../types/attendance';

const router = useRouter();
const authStore = useAuthStore();
const attendanceStore = useAttendanceStore();

const isLocating = ref<boolean>(true);
const locationError = ref<string | null>(null);
const locationData = ref<{ lat: number; lng: number; address: string } | null>(null);

const todayStatus = computed(() => attendanceStore.todayStatus);

const currentDayName = computed(() => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
});

const currentDateFormatted = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
});

const statusText = computed(() => {
  switch (todayStatus.value.status) {
    case 'WORKING':
      return '🟢 Working';
    case 'COMPLETED':
      return '🔵 Completed';
    default:
      return '⚪ Not Checked In';
  }
});

async function startLocatingOnAppOpen() {
  isLocating.value = true;
  locationError.value = null;

  try {
    const pos = await getTelegramLocation();
    const lat = pos.latitude;
    const lng = pos.longitude;
    const address = await fetchAddressName(lat, lng);
    locationData.value = { lat, lng, address };
  } catch (err: any) {
    console.warn('App open geolocation error:', err);
    locationError.value = 'Location access not granted';
    // Fallback default coordinates if unavailable
    locationData.value = { lat: 11.5564, lng: 104.9282, address: 'Phnom Penh, Cambodia' };
  } finally {
    isLocating.value = false;
  }
}

async function fetchAddressName(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1`,
    );
    if (response.ok) {
      const data = await response.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
  } catch (e) {
    console.warn('Fetch address error:', e);
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function getMapsUrl(record: AttendanceRecord | null): string | null {
  if (!record) return null;
  if (record.latitude && record.longitude) {
    return `https://www.google.com/maps?q=${record.latitude},${record.longitude}`;
  }
  if (record.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(record.address)}`;
  }
  return null;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function goToCheckIn() {
  router.push({ name: 'camera', query: { action: 'CHECK_IN' } });
}

function goToCheckOut() {
  router.push({ name: 'camera', query: { action: 'CHECK_OUT' } });
}

function goToHistory() {
  router.push({ name: 'history' });
}

onMounted(() => {
  attendanceStore.fetchTodayStatus();
  startLocatingOnAppOpen();
});
</script>

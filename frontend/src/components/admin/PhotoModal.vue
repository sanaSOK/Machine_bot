<template>
  <Teleport to="body">
    <div
      v-if="isOpen && record"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md transition-all animate-fade-in"
      @click.self="emit('close')"
    >
      <div class="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
              {{ record.user?.first_name?.charAt(0) || 'U' }}
            </div>
            <div>
              <h3 class="text-base font-bold text-white leading-tight">
                {{ record.user?.first_name }} {{ record.user?.last_name || '' }}
              </h3>
              <p class="text-xs text-slate-400">
                @{{ record.user?.username || record.user?.telegram_user_id || 'employee' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span
              class="px-3 py-1 text-xs font-bold rounded-full border"
              :class="record.action === 'CHECK_IN'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'"
            >
              {{ record.action === 'CHECK_IN' ? '📷 CHECK IN' : '🚪 CHECK OUT' }}
            </span>
            <button
              @click="emit('close')"
              class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Scrollable Modal Body -->
        <div class="p-6 overflow-y-auto space-y-6">
          <!-- Full-Size Image Container -->
          <div class="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner group">
            <img
              :src="getFullPhotoUrl(record.photo_url)"
              alt="Attendance dual photo snapshot"
              class="w-full h-full object-contain bg-black/40"
            />

            <!-- Download Button -->
            <a
              :href="getFullPhotoUrl(record.photo_url)"
              download
              target="_blank"
              class="absolute bottom-4 right-4 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold backdrop-blur-md border border-slate-700/60 shadow-xl transition-all flex items-center gap-2"
            >
              <Download class="w-4 h-4 text-indigo-400" />
              <span>Full Size</span>
            </a>
          </div>

          <!-- Metadata Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Timestamp Details -->
            <div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock class="w-3.5 h-3.5 text-indigo-400" />
                <span>Timestamp</span>
              </div>
              <div class="text-sm font-bold text-white">
                {{ formatFullDate(record.created_at) }}
              </div>
            </div>

            <!-- GPS Location & Coordinates -->
            <div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <MapPin class="w-3.5 h-3.5 text-emerald-400" />
                <span>GPS Location</span>
              </div>
              <div class="text-sm font-bold text-emerald-300 truncate">
                {{ record.address || 'Location Recorded' }}
              </div>
              <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                Lat: {{ record.latitude }}, Lng: {{ record.longitude }}
              </div>
            </div>
          </div>

          <!-- Google Maps Button -->
          <a
            v-if="record.latitude && record.longitude"
            :href="`https://www.google.com/maps?q=${record.latitude},${record.longitude}`"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full py-3.5 rounded-2xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <MapPin class="w-4 h-4 text-emerald-400" />
            <span>Open Location on Google Maps</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X, Clock, MapPin, ExternalLink, Download } from 'lucide-vue-next';
import type { AdminAttendanceRecord } from '../../types/admin';

defineProps<{
  isOpen: boolean;
  record: AdminAttendanceRecord | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function getFullPhotoUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const origin = window.location.origin;
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
</script>

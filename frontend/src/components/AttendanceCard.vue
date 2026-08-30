<template>
  <div class="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 transition-all hover:border-slate-700">
    <div class="flex items-center gap-3.5 min-w-0">
      <div
        class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
        :class="record.action === 'CHECK_IN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'"
      >
        <span class="text-xl">{{ record.action === 'CHECK_IN' ? '📷' : '🚪' }}</span>
      </div>

      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <span
            class="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
            :class="record.action === 'CHECK_IN' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'"
          >
            {{ record.action === 'CHECK_IN' ? 'Check In' : 'Check Out' }}
          </span>
          <span class="text-xs text-slate-400 font-medium">{{ formattedTime }}</span>
        </div>

        <p class="text-sm font-semibold text-slate-200 mt-1 truncate">
          {{ formattedDate }}
        </p>

        <div class="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
          <MapPin class="w-3.5 h-3.5 text-indigo-400" />
          <span v-if="record.latitude && record.longitude" class="truncate">
            {{ Number(record.latitude).toFixed(4) }}, {{ Number(record.longitude).toFixed(4) }}
          </span>
          <span v-else class="text-slate-500">Location unavailable</span>
        </div>
      </div>
    </div>

    <div v-if="fullPhotoUrl" class="shrink-0">
      <img
        :src="fullPhotoUrl"
        alt="Attendance snapshot"
        class="w-14 h-14 rounded-xl object-cover border border-slate-700/80 shadow-md bg-slate-800"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { MapPin } from 'lucide-vue-next';
import type { AttendanceRecord } from '../types/attendance';

const props = defineProps<{
  record: AttendanceRecord;
}>();

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');

const fullPhotoUrl = computed(() => {
  if (!props.record.photo_url) return '';
  if (props.record.photo_url.startsWith('http://') || props.record.photo_url.startsWith('https://')) {
    return props.record.photo_url;
  }
  return `${apiBaseUrl}${props.record.photo_url}`;
});

const formattedDate = computed(() => {
  if (!props.record.created_at) return '';
  const d = new Date(props.record.created_at);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
});

const formattedTime = computed(() => {
  if (!props.record.created_at) return '';
  const d = new Date(props.record.created_at);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
});
</script>

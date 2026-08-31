<template>
  <div class="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 transition-all hover:border-slate-700">
    <div class="flex items-center gap-3.5 min-w-0 flex-1">
      <div
        class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
        :class="record.action === 'CHECK_IN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'"
      >
        <span class="text-xl">{{ record.action === 'CHECK_IN' ? '📷' : '🚪' }}</span>
      </div>

      <div class="min-w-0 flex-1">
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

        <!-- Compact Short Map Link Button: [ 📍 Google Maps ] -->
        <a
          v-if="googleMapsUrl"
          :href="googleMapsUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold mt-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all shadow-sm group"
          title="Open in Google Maps"
        >
          <MapPin class="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
          <span>Google Maps</span>
          <ExternalLink class="w-3 h-3 text-emerald-400/80 shrink-0 ml-0.5" />
        </a>
        <div v-else class="flex items-center gap-1 text-xs text-slate-500 mt-1">
          <MapPin class="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span>No Map Pin</span>
        </div>
      </div>
    </div>

    <!-- Attendance Snapshot Image Preview -->
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
import { MapPin, ExternalLink } from 'lucide-vue-next';
import type { AttendanceRecord } from '../types/attendance';

const props = defineProps<{
  record: AttendanceRecord;
}>();

const fullPhotoUrl = computed(() => {
  if (!props.record.photo_url) return '';
  if (props.record.photo_url.startsWith('http://') || props.record.photo_url.startsWith('https://')) {
    return props.record.photo_url;
  }
  const origin = typeof window !== 'undefined' && window.location && window.location.origin
    ? window.location.origin
    : '';
  return `${origin}${props.record.photo_url}`;
});

const googleMapsUrl = computed(() => {
  if (props.record.latitude && props.record.longitude) {
    return `https://www.google.com/maps?q=${props.record.latitude},${props.record.longitude}`;
  }
  if (props.record.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.record.address)}`;
  }
  return null;
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

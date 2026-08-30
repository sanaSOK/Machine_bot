<template>
  <div class="glass-panel p-5 rounded-3xl flex items-center gap-4 shadow-xl border border-slate-700/50">
    <div class="relative">
      <img
        v-if="user?.photo_url"
        :src="user.photo_url"
        :alt="user.first_name"
        class="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/50 shadow-md"
      />
      <div
        v-else
        class="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl border-2 border-indigo-400/30 shadow-md"
      >
        {{ userInitials }}
      </div>
      <div class="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" title="Online"></div>
    </div>

    <div class="flex-1 min-w-0">
      <h2 class="text-lg font-bold text-white truncate flex items-center gap-1.5">
        <span>👤</span> {{ fullName }}
      </h2>
      <p class="text-sm text-indigo-300 font-medium truncate">
        {{ user?.username ? `@${user.username}` : 'Telegram Employee' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { User } from '../types/user';

const props = defineProps<{
  user: User | null;
}>();

const fullName = computed(() => {
  if (!props.user) return 'Guest User';
  return [props.user.first_name, props.user.last_name].filter(Boolean).join(' ');
});

const userInitials = computed(() => {
  if (!props.user?.first_name) return 'U';
  const first = props.user.first_name.charAt(0).toUpperCase();
  const last = props.user.last_name ? props.user.last_name.charAt(0).toUpperCase() : '';
  return first + last;
});
</script>

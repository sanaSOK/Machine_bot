<template>
  <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
    <div class="relative w-16 h-16 mb-4">
      <div class="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping"></div>
      <div class="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
    </div>
    <p class="text-white font-bold text-lg tracking-wide">{{ message || 'Saving attendance...' }}</p>
    <p class="text-indigo-300 text-sm mt-1">Please hold on standard camera upload...</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message?: string;
}>();
</script>

<template>
  <button
    :disabled="disabled"
    @click="$emit('click')"
    class="w-full py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-98 shadow-lg"
    :class="[
      disabled
        ? 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed shadow-none'
        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white glow-emerald cursor-pointer border border-emerald-400/30'
    ]"
  >
    <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
      <Camera class="w-5 h-5 text-white" />
    </div>
    <span>📷 CHECK IN</span>
  </button>
</template>

<script setup lang="ts">
import { Camera } from 'lucide-vue-next';

defineProps<{
  disabled?: boolean;
}>();

defineEmits<{
  (e: 'click'): void;
}>();
</script>

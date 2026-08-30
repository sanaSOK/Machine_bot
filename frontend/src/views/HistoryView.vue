<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 pb-12 max-w-md mx-auto relative">
    <!-- Header with Back Button -->
    <header class="flex items-center justify-between py-4 border-b border-slate-800/80 mb-6">
      <button
        @click="goBack"
        class="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <h1 class="text-lg font-bold text-white">Attendance History</h1>
      <div class="w-10"></div>
    </header>

    <!-- Loading State -->
    <div v-if="attendanceStore.isLoading" class="py-12 text-center text-slate-400">
      <Loader2 class="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
      <p class="text-sm">Loading attendance logs...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="attendanceStore.history.length === 0" class="glass-panel p-8 rounded-3xl text-center my-auto border border-slate-800">
      <div class="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-4 text-3xl">
        📋
      </div>
      <h3 class="text-base font-bold text-white mb-1">No Attendance Records Yet</h3>
      <p class="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed mb-6">
        Your check-in and check-out attendance records will appear here once submitted.
      </p>
      <button
        @click="goBack"
        class="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
      >
        Go to Dashboard
      </button>
    </div>

    <!-- History List -->
    <div v-else class="space-y-3.5">
      <AttendanceCard
        v-for="record in attendanceStore.history"
        :key="record.id"
        :record="record"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Loader2 } from 'lucide-vue-next';
import { useAttendanceStore } from '../stores/attendance.store';
import AttendanceCard from '../components/AttendanceCard.vue';

const router = useRouter();
const attendanceStore = useAttendanceStore();

function goBack() {
  router.push({ name: 'home' });
}

onMounted(() => {
  attendanceStore.fetchHistory();
});
</script>

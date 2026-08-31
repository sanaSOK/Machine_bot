<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 pb-12 max-w-md mx-auto relative">
    <!-- Header with Back Button and Calendar Toggle Button -->
    <header class="flex items-center justify-between py-4 border-b border-slate-800/80 mb-6">
      <button
        @click="goBack"
        class="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
        title="Back to Dashboard"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      
      <h1 class="text-lg font-bold text-white">Attendance History</h1>
      
      <!-- Calendar Icon Toggle Button (Top Right Header) -->
      <button
        @click="showCalendar = !showCalendar"
        class="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer border relative"
        :class="showCalendar ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'"
        title="Toggle Calendar View"
      >
        <Calendar class="w-5 h-5" />
        <!-- Active Filter Indicator Badge -->
        <span
          v-if="selectedDate && !showCalendar"
          class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full animate-pulse"
        ></span>
      </button>
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
        class="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
      >
        Go to Dashboard
      </button>
    </div>

    <div v-else>
      <!-- Interactive Attendance Calendar Widget (Toggled via Top-Right Calendar Icon) -->
      <Transition name="expand">
        <AttendanceCalendar
          v-if="showCalendar"
          :history-records="attendanceStore.history"
          v-model:selectedDate="selectedDate"
        />
      </Transition>

      <!-- Filter Title Info -->
      <div class="flex items-center justify-between mb-3 px-1">
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400">
          {{ selectedDate ? `Logs for ${formattedSelectedDate}` : 'All Attendance Logs' }}
        </h2>
        <div class="flex items-center gap-2">
          <button
            v-if="selectedDate"
            @click="selectedDate = null"
            class="text-xs text-slate-400 hover:text-white underline decoration-slate-600 cursor-pointer mr-1"
          >
            Reset
          </button>
          <span class="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            {{ filteredHistory.length }} {{ filteredHistory.length === 1 ? 'record' : 'records' }}
          </span>
        </div>
      </div>

      <!-- Filter Empty State -->
      <div v-if="filteredHistory.length === 0" class="glass-panel p-6 rounded-2xl text-center border border-slate-800 my-4">
        <p class="text-sm font-semibold text-slate-300 mb-1">No Records on {{ formattedSelectedDate }}</p>
        <p class="text-xs text-slate-400 mb-4">No check-in or check-out activity logged on this date.</p>
        <button
          @click="selectedDate = null"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          Show All Logs
        </button>
      </div>

      <!-- History Cards List -->
      <div v-else class="space-y-3.5">
        <AttendanceCard
          v-for="record in filteredHistory"
          :key="record.id"
          :record="record"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Loader2, Calendar } from 'lucide-vue-next';
import { useAttendanceStore } from '../stores/attendance.store';
import AttendanceCard from '../components/AttendanceCard.vue';
import AttendanceCalendar from '../components/AttendanceCalendar.vue';

const router = useRouter();
const attendanceStore = useAttendanceStore();

const showCalendar = ref(false);
const selectedDate = ref<string | null>(null);

const filteredHistory = computed(() => {
  if (!selectedDate.value) return attendanceStore.history;
  return attendanceStore.history.filter((record) => {
    if (!record.created_at) return false;
    const d = new Date(record.created_at);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dateStr === selectedDate.value;
  });
});

const formattedSelectedDate = computed(() => {
  if (!selectedDate.value) return '';
  const [year, month, day] = selectedDate.value.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
});

function goBack() {
  router.push({ name: 'home' });
}

onMounted(() => {
  attendanceStore.fetchHistory();
});
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 600px;
  opacity: 1;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  margin-bottom: 0;
}
</style>


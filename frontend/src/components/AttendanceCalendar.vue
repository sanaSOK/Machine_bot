<template>
  <div class="glass-panel p-4 rounded-3xl border border-slate-800 mb-6 bg-slate-900/60 backdrop-blur-xl">
    <!-- Month / Year Header Navigation -->
    <div class="flex items-center justify-between mb-4 px-2">
      <button
        @click="prevMonth"
        class="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
      >
        ‹
      </button>

      <span class="text-sm font-bold text-white tracking-wide">
        {{ currentMonthName }} {{ currentYear }}
      </span>

      <button
        @click="nextMonth"
        class="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
      >
        ›
      </button>
    </div>

    <!-- Days of Week Header -->
    <div class="grid grid-cols-7 gap-1 text-center mb-2">
      <span
        v-for="day in daysOfWeek"
        :key="day"
        class="text-[10px] font-bold uppercase tracking-wider text-slate-500"
      >
        {{ day }}
      </span>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7 gap-1.5 text-center">
      <!-- Empty Leading Cells -->
      <div
        v-for="blank in blankDays"
        :key="'blank-' + blank"
        class="h-9 rounded-xl"
      ></div>

      <!-- Days of Month -->
      <button
        v-for="day in daysInMonth"
        :key="'day-' + day"
        @click="selectDate(day)"
        class="h-9 rounded-xl flex flex-col items-center justify-center relative text-xs font-semibold transition-all cursor-pointer border"
        :class="getDayClasses(day)"
      >
        <span>{{ day }}</span>
        <!-- Status Dots -->
        <div v-if="hasRecordOnDay(day)" class="flex gap-0.5 mt-0.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface AttendanceRecord {
  id: number;
  created_at: string;
  type?: string;
  [key: string]: any;
}

const props = defineProps<{
  historyRecords: AttendanceRecord[];
  selectedDate: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:selectedDate', value: string | null): void;
}>();

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const currentDate = ref(new Date());

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

const currentMonthName = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { month: 'long' });
});

const blankDays = computed(() => {
  const firstDayOfMonth = new Date(currentYear.value, currentMonth.value, 1).getDay();
  return firstDayOfMonth;
});

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

function prevMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
}

function nextMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
}

function formatDateStr(day: number): string {
  const m = String(currentMonth.value + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${currentYear.value}-${m}-${d}`;
}

function hasRecordOnDay(day: number): boolean {
  const dateStr = formatDateStr(day);
  return props.historyRecords.some((rec) => {
    if (!rec.created_at) return false;
    const rd = new Date(rec.created_at);
    const rDateStr = `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}-${String(rd.getDate()).padStart(2, '0')}`;
    return rDateStr === dateStr;
  });
}

function selectDate(day: number) {
  const dateStr = formatDateStr(day);
  if (props.selectedDate === dateStr) {
    emit('update:selectedDate', null);
  } else {
    emit('update:selectedDate', dateStr);
  }
}

function getDayClasses(day: number) {
  const dateStr = formatDateStr(day);
  const isSelected = props.selectedDate === dateStr;
  const isToday = new Date().toDateString() === new Date(currentYear.value, currentMonth.value, day).toDateString();
  const hasRecord = hasRecordOnDay(day);

  if (isSelected) {
    return 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/30 scale-105';
  }
  if (isToday) {
    return 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold';
  }
  if (hasRecord) {
    return 'bg-slate-800/80 border-slate-700/80 text-white hover:border-slate-500';
  }
  return 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200';
}
</script>

<template>
  <div class="glass-panel p-4 rounded-3xl border border-slate-800 shadow-xl mb-6 select-none">
    <!-- Calendar Month Header Navigator -->
    <div class="flex items-center justify-between mb-4 px-1">
      <button
        @click="prevMonth"
        class="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
        title="Previous Month"
      >
        <ChevronLeft class="w-5 h-5" />
      </button>

      <div class="text-center">
        <h2 class="text-base font-bold text-white tracking-wide">
          {{ monthYearTitle }}
        </h2>
        <span v-if="selectedDate" class="text-[11px] text-indigo-400 font-semibold">
          Filtered: {{ formattedSelectedDate }}
        </span>
        <span v-else class="text-[11px] text-slate-400">
          Select a date to filter
        </span>
      </div>

      <button
        @click="nextMonth"
        class="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
        title="Next Month"
      >
        <ChevronRight class="w-5 h-5" />
      </button>
    </div>

    <!-- Days of Week Header (Sun-Sat) -->
    <div class="grid grid-cols-7 gap-1 text-center mb-2">
      <span
        v-for="day in weekDays"
        :key="day"
        class="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-1"
      >
        {{ day }}
      </span>
    </div>

    <!-- Calendar Days Grid -->
    <div class="grid grid-cols-7 gap-1.5 text-center">
      <button
        v-for="(dayObj, index) in calendarGrid"
        :key="index"
        @click="selectDay(dayObj)"
        :disabled="!dayObj.isCurrentMonth"
        class="relative h-10 rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all cursor-pointer group"
        :class="getDayClasses(dayObj)"
      >
        <span>{{ dayObj.dayNumber }}</span>

        <!-- Indicator Dot for Attendance Records -->
        <span
          v-if="dayObj.hasAttendance && dayObj.isCurrentMonth"
          class="w-1.5 h-1.5 rounded-full absolute bottom-1 transition-transform group-hover:scale-125"
          :class="dayObj.isSelected ? 'bg-white' : 'bg-emerald-400 shadow-sm shadow-emerald-500/50'"
        ></span>
      </button>
    </div>

    <!-- Filter Action Buttons Bar -->
    <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
      <button
        @click="selectToday"
        class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
      >
        <CalendarIcon class="w-3.5 h-3.5 text-indigo-400" />
        <span>Today</span>
      </button>

      <button
        v-if="selectedDate"
        @click="clearFilter"
        class="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
      >
        <X class="w-3.5 h-3.5" />
        <span>Show All Logs</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-vue-next';
import type { AttendanceRecord } from '../types/attendance';

const props = defineProps<{
  historyRecords: AttendanceRecord[];
  selectedDate: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:selectedDate', dateStr: string | null): void;
}>();

const currentMonthDate = ref(new Date());

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const attendanceDatesMap = computed(() => {
  const map = new Map<string, number>();
  for (const record of props.historyRecords) {
    if (record.created_at) {
      const d = new Date(record.created_at);
      const dateStr = formatDateToYYYYMMDD(d);
      map.set(dateStr, (map.get(dateStr) || 0) + 1);
    }
  }
  return map;
});

const monthYearTitle = computed(() => {
  return currentMonthDate.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
});

const formattedSelectedDate = computed(() => {
  if (!props.selectedDate) return '';
  const [year, month, day] = props.selectedDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
});

interface DayObj {
  dayNumber: number;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasAttendance: boolean;
  isSelected: boolean;
}

const calendarGrid = computed<DayObj[]>(() => {
  const year = currentMonthDate.value.getFullYear();
  const month = currentMonthDate.value.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const todayStr = formatDateToYYYYMMDD(new Date());

  const grid: DayObj[] = [];

  // Padding days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDayNum = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, prevDayNum);
    const dateStr = formatDateToYYYYMMDD(prevDate);
    grid.push({
      dayNumber: prevDayNum,
      dateString: dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      hasAttendance: attendanceDatesMap.value.has(dateStr),
      isSelected: props.selectedDate === dateStr,
    });
  }

  // Days of current month
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const curDate = new Date(year, month, d);
    const dateStr = formatDateToYYYYMMDD(curDate);
    grid.push({
      dayNumber: d,
      dateString: dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      hasAttendance: attendanceDatesMap.value.has(dateStr),
      isSelected: props.selectedDate === dateStr,
    });
  }

  // Padding days for next month to complete grid
  const remainingCells = 42 - grid.length;
  const paddingCount = remainingCells >= 7 ? remainingCells - 7 : remainingCells;
  for (let d = 1; d <= paddingCount; d++) {
    const nextDate = new Date(year, month + 1, d);
    const dateStr = formatDateToYYYYMMDD(nextDate);
    grid.push({
      dayNumber: d,
      dateString: dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      hasAttendance: attendanceDatesMap.value.has(dateStr),
      isSelected: props.selectedDate === dateStr,
    });
  }

  return grid;
});

function prevMonth() {
  currentMonthDate.value = new Date(
    currentMonthDate.value.getFullYear(),
    currentMonthDate.value.getMonth() - 1,
    1,
  );
}

function nextMonth() {
  currentMonthDate.value = new Date(
    currentMonthDate.value.getFullYear(),
    currentMonthDate.value.getMonth() + 1,
    1,
  );
}

function selectDay(dayObj: DayObj) {
  if (!dayObj.isCurrentMonth) return;
  if (props.selectedDate === dayObj.dateString) {
    emit('update:selectedDate', null);
  } else {
    emit('update:selectedDate', dayObj.dateString);
  }
}

function selectToday() {
  const todayStr = formatDateToYYYYMMDD(new Date());
  currentMonthDate.value = new Date();
  emit('update:selectedDate', todayStr);
}

function clearFilter() {
  emit('update:selectedDate', null);
}

function getDayClasses(dayObj: DayObj): string {
  if (!dayObj.isCurrentMonth) {
    return 'text-slate-700 pointer-events-none opacity-40';
  }

  if (dayObj.isSelected) {
    return 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/30 scale-105 border border-indigo-400/50';
  }

  if (dayObj.isToday) {
    return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold hover:bg-indigo-500/30';
  }

  if (dayObj.hasAttendance) {
    return 'bg-slate-900 text-slate-100 border border-slate-800 hover:bg-slate-800 hover:border-slate-700';
  }

  return 'bg-slate-950/40 text-slate-400 hover:bg-slate-900 hover:text-slate-200';
}

function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
</script>

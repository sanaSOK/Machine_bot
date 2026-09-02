<template>
  <div class="space-y-8">
    <!-- Header Section -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200 tracking-tight">
          Attendance Dashboard
        </h2>
        <p class="text-xs text-slate-400 font-medium mt-1">
          Real-time dual-photo verification, live GPS mapping, and attendance analytics
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Export Multi-Sheet Excel Button -->
        <a
          :href="adminApi.getExportCsvUrl()"
          target="_blank"
          download="eroxii_attendance_report.xlsx"
          class="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs shadow-xl transition-all flex items-center gap-2.5 glow-emerald transform active:scale-95 cursor-pointer"
        >
          <Download class="w-4 h-4" />
          <span>Export Excel Report (.xlsx)</span>
        </a>

        <!-- Refresh Button -->
        <button
          @click="refreshData"
          class="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          title="Refresh All Data"
        >
          <RefreshCw class="w-4.5 h-4.5 text-indigo-400" :class="{ 'animate-spin': adminStore.isLoadingLogs || adminStore.isLoadingStats }" />
        </button>
      </div>
    </div>

    <!-- KPI Metric Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Employees -->
      <div class="glass-card-interactive p-6 rounded-3xl relative overflow-hidden group">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Active Employees</span>
          <div class="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-110 transition-transform">
            <Users class="w-6 h-6" />
          </div>
        </div>
        <div class="text-4xl font-black text-white tracking-tight">
          {{ adminStore.stats?.totalEmployees ?? 0 }}
        </div>
        <div class="text-xs text-indigo-300/80 font-medium mt-2 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
          <span>Registered accounts</span>
        </div>
      </div>

      <!-- Today Check-Ins -->
      <div class="glass-card-interactive p-6 rounded-3xl relative overflow-hidden group">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Today's Check Ins</span>
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
            <Camera class="w-6 h-6" />
          </div>
        </div>
        <div class="text-4xl font-black text-white tracking-tight">
          {{ adminStore.stats?.todayCheckIns ?? 0 }}
        </div>
        <div class="text-xs text-emerald-300/80 font-medium mt-2 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Verified check-ins</span>
        </div>
      </div>

      <!-- Today Check-Outs -->
      <div class="glass-card-interactive p-6 rounded-3xl relative overflow-hidden group">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Today's Check Outs</span>
          <div class="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-110 transition-transform">
            <LogOut class="w-6 h-6" />
          </div>
        </div>
        <div class="text-4xl font-black text-white tracking-tight">
          {{ adminStore.stats?.todayCheckOuts ?? 0 }}
        </div>
        <div class="text-xs text-amber-300/80 font-medium mt-2 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>Completed shifts</span>
        </div>
      </div>

      <!-- Today's Absents -->
      <div class="glass-card-interactive p-6 rounded-3xl relative overflow-hidden group">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Today's Absents</span>
          <div class="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner group-hover:scale-110 transition-transform">
            <UserX class="w-6 h-6" />
          </div>
        </div>
        <div class="text-4xl font-black text-white tracking-tight">
          {{ adminStore.stats?.todayAbsents ?? Math.max(0, (adminStore.stats?.totalEmployees ?? 0) - (adminStore.stats?.todayCheckIns ?? 0)) }}
        </div>
        <div class="text-xs text-red-300/80 font-medium mt-2 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-red-400"></span>
          <span>Pending check-in today</span>
        </div>
      </div>
    </div>

    <!-- Filter & Search Controls Bar -->
    <div class="glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Search Input -->
        <div class="relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            v-model="adminStore.filters.search"
            @input="onSearchInput"
            type="text"
            placeholder="Search employee name / username..."
            class="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <!-- Action Type Filter -->
        <select
          v-model="adminStore.filters.type"
          @change="adminStore.fetchAttendanceLogs()"
          class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
        >
          <option value="">All Action Types</option>
          <option value="CHECK_IN">📷 Check In Only</option>
          <option value="CHECK_OUT">🚪 Check Out Only</option>
        </select>

        <!-- Status Filter -->
        <select
          v-model="adminStore.filters.status"
          @change="adminStore.fetchAttendanceLogs()"
          class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="PRESENT">🟢 PRESENT</option>
          <option value="LATE">🟠 LATE</option>
          <option value="CHECK_OUT">🟣 CHECK OUT</option>
        </select>

        <!-- Date Picker Filter -->
        <div class="relative">
          <input
            v-model="adminStore.filters.date"
            @change="adminStore.fetchAttendanceLogs()"
            type="date"
            class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer [color-scheme:dark]"
          />
        </div>

        <!-- Reset Filters Button -->
        <button
          @click="adminStore.resetFilters()"
          class="w-full py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/80 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-sm"
        >
          <RotateCcw class="w-4 h-4 text-indigo-400" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>

    <!-- Attendance Log Data Table -->
    <div class="glass-panel rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
      <!-- Loading State -->
      <div v-if="adminStore.isLoadingLogs" class="p-16 text-center text-slate-400">
        <Loader2 class="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-3" />
        <p class="text-xs font-semibold text-slate-300">Fetching live attendance records...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!adminStore.attendanceLogs || adminStore.attendanceLogs.length === 0" class="p-16 text-center text-slate-400">
        <FileX class="w-14 h-14 text-slate-600 mx-auto mb-3" />
        <p class="text-base font-extrabold text-slate-200">No attendance records found</p>
        <p class="text-xs text-slate-500 mt-1">Try adjusting your date or search filters above.</p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-slate-800/80 bg-slate-900/90 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              <th class="py-4.5 px-6">Employee</th>
              <th class="py-4.5 px-6">Action</th>
              <th class="py-4.5 px-6">Date & Time</th>
              <th class="py-4.5 px-6">Status</th>
              <th class="py-4.5 px-6">GPS Location</th>
              <th class="py-4.5 px-6 text-center">Dual Photo</th>
              <th class="py-4.5 px-6 text-right">Actions</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-800/50 font-medium">
            <tr
              v-for="record in (adminStore.attendanceLogs || [])"
              :key="record.id"
              class="hover:bg-slate-800/50 transition-colors group"
            >
              <!-- Employee Info -->
              <td class="py-4.5 px-6">
                <div class="flex items-center gap-3.5">
                  <img
                    v-if="record.user?.photo_url"
                    :src="record.user.photo_url"
                    :alt="record.user.first_name"
                    class="w-10 h-10 rounded-2xl object-cover border border-indigo-400/30 shrink-0 shadow-md"
                    @error="record.user.photo_url = ''"
                  />
                  <div
                    v-else
                    class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 border border-indigo-400/30 flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-md"
                  >
                    {{ record.user?.first_name?.charAt(0) || 'U' }}
                  </div>
                  <div>
                    <div class="font-bold text-white text-sm leading-tight group-hover:text-indigo-300 transition-colors">
                      {{ record.user?.first_name || 'Employee' }} {{ record.user?.last_name || '' }}
                    </div>
                    <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                      @{{ record.user?.username || record.user?.telegram_user_id || 'unknown' }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Action Badge -->
              <td class="py-4.5 px-6 whitespace-nowrap">
                <span
                  class="px-3 py-1.5 rounded-xl text-[11px] font-extrabold inline-flex items-center gap-1.5 border shadow-sm"
                  :class="record.action === 'CHECK_IN'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 glow-emerald'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30 glow-amber'"
                >
                  <span class="w-2 h-2 rounded-full" :class="record.action === 'CHECK_IN' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></span>
                  {{ record.action === 'CHECK_IN' ? 'CHECK IN' : 'CHECK OUT' }}
                </span>
              </td>

              <!-- Timestamp -->
              <td class="py-4.5 px-6 text-slate-300 font-semibold whitespace-nowrap">
                {{ formatDate(record.created_at) }}
              </td>

              <!-- Attendance Status (Present / Late / Check Out) -->
              <td class="py-4.5 px-6 whitespace-nowrap">
                <span
                  class="px-3 py-1.5 rounded-xl text-[11px] font-extrabold inline-flex items-center gap-1.5 border"
                  :class="getAttendanceStatus(record).badgeClass"
                >
                  <span class="w-2 h-2 rounded-full" :class="getAttendanceStatus(record).dotClass"></span>
                  {{ getAttendanceStatus(record).label }}
                </span>
              </td>

              <!-- Location & Address -->
              <td class="py-4.5 px-6 max-w-xs">
                <div class="text-slate-200 font-bold truncate" :title="record.address || ''">
                  {{ record.address || 'Location Recorded' }}
                </div>
                <div class="text-[11px] text-slate-400 font-mono mt-0.5" v-if="record.latitude && record.longitude">
                  GPS: {{ formatCoordinate(record.latitude) }}, {{ formatCoordinate(record.longitude) }}
                </div>
              </td>

              <!-- Photo Thumbnail Frame -->
              <td class="py-4.5 px-6 text-center">
                <button
                  @click="adminStore.openPhotoModal(record)"
                  class="inline-block relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-700 hover:border-indigo-400 transition-all shadow-lg group/img cursor-pointer"
                  title="Click to view full dual snapshot"
                >
                  <img
                    :src="getPhotoThumbnailUrl(record.photo_url)"
                    alt="Photo Snapshot"
                    class="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                  />
                  <div class="absolute inset-0 bg-indigo-950/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                    <Eye class="w-5 h-5 text-white" />
                  </div>
                </button>
              </td>

              <!-- Actions (Maps link) -->
              <td class="py-4.5 px-6 text-right whitespace-nowrap">
                <a
                  v-if="record.latitude && record.longitude"
                  :href="`https://www.google.com/maps?q=${record.latitude},${record.longitude}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-all shadow-sm active:scale-95"
                  title="View on Google Maps"
                >
                  <MapPin class="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Maps</span>
                  <ExternalLink class="w-3 h-3 text-slate-400" />
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="adminStore.totalLogs > 0" class="p-5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400 font-medium">
        <div>
          Showing <span class="font-bold text-white">{{ Math.min(adminStore.filters.offset + 1, adminStore.totalLogs) }}</span> to <span class="font-bold text-white">{{ Math.min(adminStore.filters.offset + adminStore.filters.limit, adminStore.totalLogs) }}</span> of <span class="font-bold text-white">{{ adminStore.totalLogs }}</span> records
        </div>

        <div class="flex items-center gap-2">
          <button
            :disabled="adminStore.filters.offset === 0"
            @click="adminStore.setPage(currentPage - 1)"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 transition-all font-bold cursor-pointer"
          >
            Previous
          </button>
          <span class="px-3 font-extrabold text-indigo-300">Page {{ currentPage }}</span>
          <button
            :disabled="adminStore.filters.offset + adminStore.filters.limit >= adminStore.totalLogs"
            @click="adminStore.setPage(currentPage + 1)"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 transition-all font-bold cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Photo Inspection Modal -->
    <PhotoModal
      :is-open="adminStore.isPhotoModalOpen"
      :record="adminStore.selectedRecord"
      @close="adminStore.closePhotoModal()"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import {
  Users,
  Camera,
  LogOut,
  Search,
  RotateCcw,
  RefreshCw,
  Loader2,
  FileX,
  Eye,
  MapPin,
  ExternalLink,
  Download,
  UserX,
} from 'lucide-vue-next';
import { useAdminStore } from '../../stores/admin.store';
import { adminApi } from '../../services/admin.api';
import PhotoModal from '../../components/admin/PhotoModal.vue';
import type { AdminAttendanceRecord } from '../../types/admin';

const adminStore = useAdminStore();

const currentPage = computed(() => {
  const limit = adminStore.filters?.limit || 20;
  const offset = adminStore.filters?.offset || 0;
  return Math.floor(offset / limit) + 1;
});

let searchTimeout: any = null;
function onSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (adminStore.filters) {
      adminStore.filters.offset = 0;
    }
    adminStore.fetchAttendanceLogs();
  }, 350);
}

function refreshData() {
  adminStore.fetchStats();
  adminStore.fetchAttendanceLogs();
}

function getPhotoThumbnailUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const origin = window.location.origin;
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

function formatCoordinate(val: any): string {
  const num = Number(val);
  return isNaN(num) ? '0.0000' : num.toFixed(4);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getAttendanceStatus(record: AdminAttendanceRecord) {
  if (record.action === 'CHECK_OUT') {
    return {
      label: 'CHECK OUT',
      badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-sm',
      dotClass: 'bg-indigo-400',
    };
  }

  const settings = adminStore.settings;
  const recordDate = new Date(record.created_at);
  const checkInMinutes = recordDate.getHours() * 60 + recordDate.getMinutes();

  const [startHour, startMin] = (settings?.workStartTime || '08:00').split(':').map(Number);
  const workStartMinutes = (startHour || 8) * 60 + (startMin || 0);
  const gracePeriod = settings?.gracePeriodMinutes ?? 15;
  const maxOnTimeMinutes = workStartMinutes + gracePeriod;

  if (checkInMinutes > maxOnTimeMinutes) {
    const lateBy = checkInMinutes - maxOnTimeMinutes;
    return {
      label: lateBy > 0 ? `LATE (${lateBy}m)` : 'LATE',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30 glow-amber shadow-sm',
      dotClass: 'bg-amber-400 animate-pulse',
    };
  }

  return {
    label: 'PRESENT',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 glow-emerald shadow-sm',
    dotClass: 'bg-emerald-400 animate-pulse',
  };
}

onMounted(() => {
  adminStore.fetchSettings();
  adminStore.fetchStats();
  adminStore.fetchAttendanceLogs();
});
</script>

<style scoped>
:deep(input[type="date"]::-webkit-calendar-picker-indicator),
input[type="date"]::-webkit-calendar-picker-indicator {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>') !important;
  filter: none !important;
  cursor: pointer !important;
  opacity: 1 !important;
}
</style>

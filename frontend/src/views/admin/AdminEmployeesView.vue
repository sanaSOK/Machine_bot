<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200 tracking-tight">
          Users
        </h2>
        <p class="text-xs text-slate-400 font-medium mt-1">
          Registered Telegram accounts, user roles, and check-in history
        </p>
      </div>

      <button
        @click="adminStore.fetchEmployees()"
        class="px-4.5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer w-fit shadow-md active:scale-95"
      >
        <RefreshCw class="w-4 h-4 text-indigo-400" :class="{ 'animate-spin': adminStore.isLoadingEmployees }" />
        <span>Refresh Users</span>
      </button>
    </div>

    <!-- Alert Notifications -->
    <div v-if="adminStore.successMessage" class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-md">
      <div class="flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{{ adminStore.successMessage }}</span>
      </div>
      <button @click="adminStore.successMessage = null" class="text-xs text-emerald-400 hover:text-emerald-300 font-bold">Dismiss</button>
    </div>

    <div v-if="adminStore.error" class="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-between shadow-md">
      <div class="flex items-center gap-2">
        <AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
        <span>{{ adminStore.error }}</span>
      </div>
      <button @click="adminStore.error = null" class="text-xs text-red-400 hover:text-red-300 font-bold">Dismiss</button>
    </div>

    <!-- Search Controls Bar -->
    <div class="glass-panel p-5 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <Search class="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          v-model="adminStore.employeeFilters.search"
          @input="onSearchInput"
          type="text"
          placeholder="Search user name / username..."
          class="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      <div class="text-xs font-bold text-slate-400 flex items-center gap-2">
        <Edit3 class="w-3.5 h-3.5 text-indigo-400" />
        <span>Click any role field to type custom characters (Press Enter or click outside to save)</span>
      </div>
    </div>

    <!-- Users Table -->
    <div class="glass-panel rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
      <!-- Loading State -->
      <div v-if="adminStore.isLoadingEmployees" class="p-16 text-center space-y-3">
        <Loader2 class="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading User Directory...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="adminStore.employees.length === 0" class="p-16 text-center space-y-3">
        <div class="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
          <Users class="w-7 h-7" />
        </div>
        <h3 class="text-sm font-extrabold text-white">No Users Found</h3>
        <p class="text-xs text-slate-400 max-w-xs mx-auto">
          No registered Telegram users matched your search criteria.
        </p>
      </div>

      <!-- Data Table -->
      <div v-else class="overflow-x-auto min-w-full">
        <table class="w-full text-left border-collapse min-w-[750px]">
          <thead>
            <tr class="border-b border-slate-800/80 bg-slate-950/60 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <th class="py-4 px-6">ID</th>
              <th class="py-4 px-6">User</th>
              <th class="py-4 px-6">Telegram ID</th>
              <th class="py-4 px-6">Role (Editable Input)</th>
              <th class="py-4 px-6">Status</th>
              <th class="py-4 px-6">Total Check-ins</th>
              <th class="py-4 px-6">Joined Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/50 text-xs font-medium">
            <tr
              v-for="user in adminStore.employees"
              :key="user.id"
              class="hover:bg-slate-900/40 transition-colors group"
            >
              <!-- ID -->
              <td class="py-4.5 px-6 font-mono text-slate-400 font-bold">
                #{{ user.id }}
              </td>

              <!-- User Info -->
              <td class="py-4.5 px-6">
                <div class="flex items-center gap-3.5">
                  <img
                    v-if="user.photo_url"
                    :src="user.photo_url"
                    :alt="user.first_name"
                    class="w-10 h-10 rounded-2xl object-cover border border-indigo-400/30 shrink-0 shadow-md"
                    @error="user.photo_url = ''"
                  />
                  <div
                    v-else
                    class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 border border-indigo-400/30 flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-md"
                  >
                    {{ user.first_name?.charAt(0) || 'U' }}
                  </div>
                  <div>
                    <div class="font-bold text-white text-sm leading-tight group-hover:text-indigo-300 transition-colors">
                      {{ user.first_name }} {{ user.last_name || '' }}
                    </div>
                    <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                      @{{ user.username || 'no_username' }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Telegram User ID -->
              <td class="py-4.5 px-6 text-slate-300 font-mono font-bold">
                {{ user.telegram_user_id }}
              </td>

              <!-- Custom Text Input Role Field with Ellipsis Truncation -->
              <td class="py-4.5 px-6">
                <div class="relative inline-flex items-center group max-w-[150px]">
                  <input
                    type="text"
                    :value="editingRoles[user.id] !== undefined ? editingRoles[user.id] : (user.role || 'EMPLOYEE')"
                    @input="editingRoles[user.id] = ($event.target as HTMLInputElement).value"
                    @keyup.enter="saveUserRole(user)"
                    @blur="saveUserRole(user)"
                    :disabled="updatingUserId === user.id"
                    placeholder="Type role..."
                    :title="editingRoles[user.id] !== undefined ? editingRoles[user.id] : (user.role || 'EMPLOYEE')"
                    class="pl-3.5 pr-8 py-1.5 rounded-xl text-[11px] font-extrabold tracking-wider uppercase border shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 w-full truncate"
                    :class="user.role === 'ADMIN'
                      ? 'bg-purple-500/20 text-purple-200 border-purple-500/40 focus:border-purple-400'
                      : 'bg-slate-950 text-indigo-200 border-slate-700 focus:border-indigo-500'"
                  />
                  <Edit3 class="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0" />
                </div>
              </td>

              <!-- Today Attendance Status (Present / Late / Absent) -->
              <td class="py-4.5 px-6 whitespace-nowrap">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-extrabold border shadow-sm"
                  :class="getUserStatusToday(user).badgeClass"
                >
                  <span class="w-2 h-2 rounded-full" :class="getUserStatusToday(user).dotClass"></span>
                  {{ getUserStatusToday(user).label }}
                </span>
              </td>

              <!-- Total Check-ins -->
              <td class="py-4.5 px-6 font-bold text-white text-sm">
                {{ user.totalAttendances || 0 }}
              </td>

              <!-- Joined Date -->
              <td class="py-4.5 px-6 text-slate-400 font-medium">
                {{ formatDate(user.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Footer -->
        <div class="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs">
          <span class="text-slate-400 font-medium">
            Showing <span class="font-bold text-white">{{ adminStore.employees.length }}</span> of <span class="font-bold text-white">{{ adminStore.totalEmployeeRecords }}</span> users
          </span>

          <div class="flex items-center gap-2">
            <button
              :disabled="adminStore.employeeFilters.offset === 0"
              @click="adminStore.setEmployeePage(currentEmployeePage - 1)"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 transition-all font-bold cursor-pointer"
            >
              Previous
            </button>
            <span class="px-3 font-extrabold text-indigo-300">Page {{ currentEmployeePage }}</span>
            <button
              :disabled="adminStore.employeeFilters.offset + adminStore.employeeFilters.limit >= adminStore.totalEmployeeRecords"
              @click="adminStore.setEmployeePage(currentEmployeePage + 1)"
              class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 transition-all font-bold cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RefreshCw, Loader2, Users, Search, Edit3, CheckCircle2, AlertCircle } from 'lucide-vue-next';
import { useAdminStore } from '../../stores/admin.store';
import type { AdminUser } from '../../types/admin';

const adminStore = useAdminStore();
const updatingUserId = ref<number | null>(null);
const editingRoles = ref<Record<number, string>>({});

const currentEmployeePage = computed(() => {
  const limit = adminStore.employeeFilters?.limit || 10;
  const offset = adminStore.employeeFilters?.offset || 0;
  return Math.floor(offset / limit) + 1;
});

let searchTimeout: any = null;
function onSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    adminStore.employeeFilters.offset = 0;
    adminStore.fetchEmployees();
  }, 350);
}

async function saveUserRole(user: AdminUser) {
  const newRole = editingRoles.value[user.id];
  if (newRole === undefined) return;
  const trimmed = newRole.trim().toUpperCase();
  if (trimmed === (user.role || '').toUpperCase()) {
    delete editingRoles.value[user.id];
    return;
  }

  updatingUserId.value = user.id;
  const ok = await adminStore.updateUserRole(user.id, trimmed);
  if (ok) {
    delete editingRoles.value[user.id];
  }
  updatingUserId.value = null;
}

function getUserStatusToday(user: AdminUser) {
  if (!user.todayCheckIn) {
    return {
      label: 'ABSENT',
      badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30 glow-red',
      dotClass: 'bg-red-400',
    };
  }

  const settings = adminStore.settings;
  const checkInDate = new Date(user.todayCheckIn.created_at);
  const checkInMinutes = checkInDate.getHours() * 60 + checkInDate.getMinutes();

  const [startHour, startMin] = (settings?.workStartTime || '08:00').split(':').map(Number);
  const workStartMinutes = (startHour || 8) * 60 + (startMin || 0);
  const gracePeriod = settings?.gracePeriodMinutes ?? 15;
  const maxOnTimeMinutes = workStartMinutes + gracePeriod;

  if (checkInMinutes > maxOnTimeMinutes) {
    const lateBy = checkInMinutes - maxOnTimeMinutes;
    return {
      label: lateBy > 0 ? `LATE (${lateBy}m)` : 'LATE',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30 glow-amber',
      dotClass: 'bg-amber-400 animate-pulse',
    };
  }

  return {
    label: 'PRESENT',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 glow-emerald',
    dotClass: 'bg-emerald-400 animate-pulse',
  };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

onMounted(() => {
  adminStore.fetchSettings();
  adminStore.fetchEmployees();
});
</script>

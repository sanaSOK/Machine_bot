<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 tracking-tight">
          Super Admin Dashboard
        </h2>
        <p class="text-xs text-slate-400 font-medium mt-1">
          Global system overview, multi-tenant admin control, and live statistics
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="superAdminStore.fetchStats(); superAdminStore.fetchAdmins()"
          class="px-4.5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
        >
          <RefreshCw class="w-4 h-4 text-amber-400" :class="{ 'animate-spin': superAdminStore.isLoadingStats }" />
          <span>Refresh System</span>
        </button>

        <router-link
          to="/super-admin/admins"
          class="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg glow-amber cursor-pointer active:scale-95"
        >
          <Plus class="w-4 h-4 stroke-[3]" />
          <span>Create New Admin</span>
        </router-link>
      </div>
    </div>

    <!-- Alert Notifications -->
    <div v-if="superAdminStore.successMessage" class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-md">
      <div class="flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{{ superAdminStore.successMessage }}</span>
      </div>
      <button @click="superAdminStore.successMessage = null" class="text-xs text-emerald-400 font-bold">Dismiss</button>
    </div>

    <div v-if="superAdminStore.error" class="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-between shadow-md">
      <div class="flex items-center gap-2">
        <AlertCircle class="w-4 h-4 text-red-400 shrink-0" />
        <span>{{ superAdminStore.error }}</span>
      </div>
      <button @click="superAdminStore.error = null" class="text-xs text-red-400 font-bold">Dismiss</button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <!-- Total Admins -->
      <div class="glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Managed Admins</p>
            <h3 class="text-3xl font-black text-white mt-1.5 font-mono">
              {{ superAdminStore.stats.totalAdmins }}
            </h3>
          </div>
          <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner group-hover:scale-110 transition-transform">
            <Building2 class="w-6 h-6" />
          </div>
        </div>
      </div>

      <!-- Total Active Staff -->
      <div class="glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Active Staff</p>
            <h3 class="text-3xl font-black text-indigo-300 mt-1.5 font-mono">
              {{ superAdminStore.stats.totalActiveStaff }}
            </h3>
          </div>
          <div class="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner group-hover:scale-110 transition-transform">
            <Users class="w-6 h-6" />
          </div>
        </div>
      </div>

      <!-- Total Today Check-Ins -->
      <div class="glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Today Check-Ins</p>
            <h3 class="text-3xl font-black text-purple-300 mt-1.5 font-mono">
              {{ superAdminStore.stats.totalTodayCheckIns }}
            </h3>
          </div>
          <div class="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-inner group-hover:scale-110 transition-transform">
            <Activity class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Admin Table Overview -->
    <div class="glass-panel rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
      <div class="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Building2 class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-extrabold text-white">System Admin Accounts</h3>
            <p class="text-xs text-slate-400 font-medium">Currently managed admin accounts and verification states</p>
          </div>
        </div>

        <router-link
          to="/super-admin/admins"
          class="text-xs font-extrabold text-amber-400 hover:text-amber-300 flex items-center gap-1 group"
        >
          <span>Manage All Admins</span>
          <ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </router-link>
      </div>

      <!-- Data Table -->
      <div class="overflow-x-auto min-w-full">
        <table class="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr class="border-b border-slate-800/80 bg-slate-950/60 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <th class="py-4 px-6">Admin Name & Email</th>
              <th class="py-4 px-6">Status</th>
              <th class="py-4 px-6">Email Verification</th>
              <th class="py-4 px-6">Created Date</th>
              <th class="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/50 text-xs font-medium">
            <tr
              v-for="admin in superAdminStore.admins"
              :key="admin.id"
              class="hover:bg-slate-900/40 transition-colors group"
            >
              <!-- Name & Email -->
              <td class="py-4.5 px-6">
                <div class="flex items-center gap-3.5">
                  <div class="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 shrink-0 shadow-md overflow-hidden flex items-center justify-center text-indigo-400 font-bold">
                    {{ admin.fullname.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                      {{ admin.fullname }}
                    </div>
                    <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                      {{ admin.email }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Status Badge -->
              <td class="py-4.5 px-6 whitespace-nowrap">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm"
                  :class="admin.is_active === 1
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-red-500/15 text-red-300 border-red-500/30'"
                >
                  <span class="w-2 h-2 rounded-full" :class="admin.is_active === 1 ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'"></span>
                  {{ admin.is_active === 1 ? 'ACTIVE' : 'INACTIVE' }}
                </span>
              </td>

              <!-- Verification Badge -->
              <td class="py-4.5 px-6 whitespace-nowrap">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm"
                  :class="admin.is_verified === 1
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'"
                >
                  <CheckCircle2 v-if="admin.is_verified === 1" class="w-3.5 h-3.5 text-indigo-400" />
                  <AlertCircle v-else class="w-3.5 h-3.5 text-amber-400" />
                  {{ admin.is_verified === 1 ? 'VERIFIED' : 'PENDING VERIFICATION' }}
                </span>
              </td>

              <!-- Created Date -->
              <td class="py-4.5 px-6 text-slate-400 font-mono">
                {{ formatDate(admin.created_at) }}
              </td>

              <!-- Actions -->
              <td class="py-4.5 px-6 text-right">
                <button
                  @click="superAdminStore.toggleAdminStatus(admin.id, admin.is_active)"
                  class="px-3.5 py-1.5 rounded-xl border font-bold text-[11px] transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  :class="admin.is_active === 1 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'"
                >
                  <span>{{ admin.is_active === 1 ? 'Deactivate' : 'Activate' }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import {
  Building2,
  Users,
  Activity,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-vue-next';
import { useSuperAdminStore } from '../../stores/super-admin.store';

const superAdminStore = useSuperAdminStore();

onMounted(() => {
  superAdminStore.fetchStats();
  superAdminStore.fetchAdmins();
});

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 tracking-tight">
          Admin Account Management
        </h2>
        <p class="text-xs text-slate-400 font-medium mt-1">
          Provision new administrators, trigger email verification, and toggle active status
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="superAdminStore.fetchAdmins()"
          class="px-4.5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
        >
          <RefreshCw class="w-4 h-4 text-amber-400" :class="{ 'animate-spin': superAdminStore.isLoadingAdmins }" />
          <span>Refresh</span>
        </button>

        <button
          @click="openCreateModal"
          class="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2.5 shadow-lg glow-amber cursor-pointer active:scale-95"
        >
          <Plus class="w-4 h-4 stroke-[3]" />
          <span>Create New Admin</span>
        </button>
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

    <!-- Search Controls Bar -->
    <div class="glass-panel p-5 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <Search class="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search admin name or email..."
          class="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-all"
        />
      </div>

      <div class="text-xs font-bold text-slate-400 flex items-center gap-2">
        <Building2 class="w-3.5 h-3.5 text-amber-400" />
        <span>Showing {{ filteredAdmins.length }} Admin accounts</span>
      </div>
    </div>

    <!-- Admin Table -->
    <div class="glass-panel rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
      <!-- Loading State -->
      <div v-if="superAdminStore.isLoadingAdmins" class="p-16 text-center space-y-3">
        <Loader2 class="w-8 h-8 animate-spin text-amber-400 mx-auto" />
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Admin Accounts...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredAdmins.length === 0" class="p-16 text-center space-y-3">
        <div class="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
          <Building2 class="w-7 h-7" />
        </div>
        <h3 class="text-sm font-extrabold text-white">No Admin Accounts Found</h3>
        <p class="text-xs text-slate-400 max-w-xs mx-auto">
          No admin matched your search query.
        </p>
      </div>

      <!-- Table Data -->
      <div v-else class="overflow-x-auto min-w-full">
        <table class="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr class="border-b border-slate-800/80 bg-slate-950/60 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <th class="py-4 px-6">Admin Name & Email</th>
              <th class="py-4 px-6">Role</th>
              <th class="py-4 px-6">Account Status</th>
              <th class="py-4 px-6">Email Verification</th>
              <th class="py-4 px-6">Created Date</th>
              <th class="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/50 text-xs font-medium">
            <tr
              v-for="admin in filteredAdmins"
              :key="admin.id"
              class="hover:bg-slate-900/40 transition-colors group"
            >
              <!-- Name & Email -->
              <td class="py-4.5 px-6">
                <div class="flex items-center gap-3.5">
                  <div class="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 shrink-0 shadow-md overflow-hidden flex items-center justify-center text-indigo-400 font-bold text-sm">
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

              <!-- Role -->
              <td class="py-4.5 px-6 font-mono text-slate-300 font-bold">
                <span class="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                  {{ admin.role === 1 ? 'SUPER ADMIN' : 'ADMIN' }}
                </span>
              </td>

              <!-- Status Toggle -->
              <td class="py-4.5 px-6 whitespace-nowrap">
                <button
                  @click="superAdminStore.toggleAdminStatus(admin.id, admin.is_active)"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
                  :class="admin.is_active === 1
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-red-500/15 text-red-300 border-red-500/30'"
                  :title="admin.is_active === 1 ? 'Click to Deactivate' : 'Click to Activate'"
                >
                  <span class="w-2 h-2 rounded-full" :class="admin.is_active === 1 ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'"></span>
                  {{ admin.is_active === 1 ? 'ACTIVE' : 'INACTIVE' }}
                </button>
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
                <div class="flex items-center justify-end gap-2">
                  <button
                    v-if="admin.role !== 1"
                    @click="confirmDelete(admin)"
                    class="p-2 rounded-xl bg-slate-900/90 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-500/30 transition-all cursor-pointer shadow-sm"
                    title="Delete Admin"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Admin Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
    >
      <div
        class="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
      >
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Building2 class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-lg font-black text-white">
                Create Admin Account
              </h3>
              <p class="text-xs text-slate-400 font-medium">Sends email verification link upon creation</p>
            </div>
          </div>
          <button
            @click="isModalOpen = false"
            class="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name <span class="text-red-400">*</span>
            </label>
            <input
              v-model="form.fullname"
              type="text"
              required
              placeholder="e.g. John Doe"
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Email Address <span class="text-red-400">*</span>
            </label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="admin@example.com"
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password <span class="text-red-400">*</span>
            </label>
            <input
              v-model="form.password"
              type="password"
              required
              placeholder="••••••••••••"
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              @click="isModalOpen = false"
              class="px-4.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="superAdminStore.isCreatingAdmin || !form.email.trim() || !form.password.trim()"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="superAdminStore.isCreatingAdmin" class="w-4 h-4 animate-spin" />
              <CheckCircle2 v-else class="w-4 h-4" />
              <span>Create & Send Link</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Building2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-vue-next';
import { useSuperAdminStore } from '../../stores/super-admin.store';
import type { AdminUser } from '../../types/super-admin';

const superAdminStore = useSuperAdminStore();

const searchQuery = ref('');
const isModalOpen = ref(false);

const form = ref<{
  fullname: string;
  email: string;
  password: string;
}>({
  fullname: '',
  email: '',
  password: '',
});

const filteredAdmins = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return superAdminStore.admins;
  return superAdminStore.admins.filter(
    (a) =>
      a.fullname.toLowerCase().includes(query) ||
      a.email.toLowerCase().includes(query),
  );
});

onMounted(() => {
  superAdminStore.fetchAdmins();
});

function openCreateModal() {
  form.value = {
    fullname: '',
    email: '',
    password: '',
  };
  isModalOpen.value = true;
}

async function handleSubmit() {
  if (!form.value.email.trim() || !form.value.password.trim()) return;

  const success = await superAdminStore.createAdmin(form.value);
  if (success) {
    isModalOpen.value = false;
  }
}

async function confirmDelete(admin: AdminUser) {
  if (confirm(`Are you sure you want to delete admin account "${admin.email}"?`)) {
    await superAdminStore.deleteAdmin(admin.id);
  }
}

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

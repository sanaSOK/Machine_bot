<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 tracking-tight">
          Admin Organizations
        </h2>
        <p class="text-xs text-slate-400 font-medium mt-1">
          Provision, configure, suspend, and manage all admin accounts & company tenants
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="superAdminStore.fetchAdminOrgs()"
          class="px-4.5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
        >
          <RefreshCw class="w-4 h-4 text-amber-400" :class="{ 'animate-spin': superAdminStore.isLoadingOrgs }" />
          <span>Refresh</span>
        </button>

        <button
          @click="openCreateModal"
          class="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2.5 shadow-lg glow-amber cursor-pointer active:scale-95"
        >
          <Plus class="w-4 h-4 stroke-[3]" />
          <span>Create Admin Org</span>
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
          placeholder="Search admin company name / email..."
          class="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-all"
        />
      </div>

      <div class="text-xs font-bold text-slate-400 flex items-center gap-2">
        <Building2 class="w-3.5 h-3.5 text-amber-400" />
        <span>Showing {{ filteredOrgs.length }} registered Admin Orgs</span>
      </div>
    </div>

    <!-- Admin Orgs Table -->
    <div class="glass-panel rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
      <!-- Loading State -->
      <div v-if="superAdminStore.isLoadingOrgs" class="p-16 text-center space-y-3">
        <Loader2 class="w-8 h-8 animate-spin text-amber-400 mx-auto" />
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Admin Organizations...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredOrgs.length === 0" class="p-16 text-center space-y-3">
        <div class="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
          <Building2 class="w-7 h-7" />
        </div>
        <h3 class="text-sm font-extrabold text-white">No Admin Organizations Found</h3>
        <p class="text-xs text-slate-400 max-w-xs mx-auto">
          No admin org matched your search criteria.
        </p>
      </div>

      <!-- Table Data -->
      <div v-else class="overflow-x-auto min-w-full">
        <table class="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr class="border-b border-slate-800/80 bg-slate-950/60 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <th class="py-4 px-6">Company</th>
              <th class="py-4 px-6">Admin Username</th>
              <th class="py-4 px-6">Work Schedule</th>
              <th class="py-4 px-6">Status</th>
              <th class="py-4 px-6">Total Employees</th>
              <th class="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/50 text-xs font-medium">
            <tr
              v-for="org in filteredOrgs"
              :key="org.id"
              class="hover:bg-slate-900/40 transition-colors group"
            >
              <!-- Company Info -->
              <td class="py-4.5 px-6">
                <div class="flex items-center gap-3.5">
                  <div class="w-10 h-10 rounded-2xl bg-white p-0.5 border border-amber-400/30 shrink-0 shadow-md overflow-hidden flex items-center justify-center">
                    <img :src="org.logoUrl || '/logo.png'" :alt="org.companyName" class="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div class="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                      {{ org.companyName }}
                    </div>
                    <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                      {{ org.contactEmail }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Admin Username -->
              <td class="py-4.5 px-6 font-mono text-slate-300 font-bold">
                @{{ org.adminUsername }}
              </td>

              <!-- Work Schedule -->
              <td class="py-4.5 px-6 font-mono text-slate-300">
                <span class="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold">
                  {{ org.workStartTime || '08:00' }} - {{ org.workEndTime || '17:00' }}
                </span>
              </td>

              <!-- Status Toggle -->
              <td class="py-4.5 px-6 whitespace-nowrap">
                <button
                  @click="toggleStatus(org)"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
                  :class="org.status === 'ACTIVE'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 glow-emerald'
                    : 'bg-red-500/15 text-red-300 border-red-500/30 glow-red'"
                  :title="org.status === 'ACTIVE' ? 'Click to Suspend' : 'Click to Activate'"
                >
                  <span class="w-2 h-2 rounded-full" :class="org.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'"></span>
                  {{ org.status }}
                </button>
              </td>

              <!-- Total Employees -->
              <td class="py-4.5 px-6 font-bold text-white font-mono text-sm">
                {{ org.totalEmployees || 0 }} members
              </td>

              <!-- Actions -->
              <td class="py-4.5 px-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openEditModal(org)"
                    class="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer shadow-sm"
                    title="Edit Admin Config"
                  >
                    <Edit3 class="w-4 h-4 text-indigo-400" />
                  </button>

                  <button
                    v-if="org.id !== 'org_eroxii'"
                    @click="confirmDelete(org)"
                    class="p-2 rounded-xl bg-slate-900/90 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-slate-800 hover:border-red-500/30 transition-all cursor-pointer shadow-sm"
                    title="Delete Admin Org"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>

                  <router-link
                    to="/admin"
                    class="p-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer shadow-sm"
                    title="Open Console"
                  >
                    <ExternalLink class="w-4 h-4" />
                  </router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Admin Org Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
    >
      <div
        class="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Building2 class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-lg font-black text-white">
                {{ isEditMode ? 'Edit Admin Organization' : 'Create Admin Organization' }}
              </h3>
              <p class="text-xs text-slate-400 font-medium">Provision and configure admin tenant details</p>
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
              Company / Admin Name <span class="text-red-400">*</span>
            </label>
            <input
              v-model="form.companyName"
              type="text"
              required
              placeholder="e.g. Acme Enterprise"
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Username
              </label>
              <input
                v-model="form.adminUsername"
                type="text"
                placeholder="e.g. acme_admin"
                class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Contact Email
              </label>
              <input
                v-model="form.contactEmail"
                type="email"
                placeholder="admin@acme.com"
                class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Start Time
              </label>
              <input
                v-model="form.workStartTime"
                type="time"
                class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-amber-500/80 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Work End Time
              </label>
              <input
                v-model="form.workEndTime"
                type="time"
                class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-amber-500/80 transition-all"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Telegram Bot Token
            </label>
            <input
              v-model="form.telegramBotToken"
              type="text"
              placeholder="e.g. 123456789:ABCDefgh..."
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Telegram Notification Chat ID
            </label>
            <input
              v-model="form.telegramNotificationChatId"
              type="text"
              placeholder="e.g. -100123456789"
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              v-model="form.status"
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-amber-500/80 transition-all"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
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
              :disabled="superAdminStore.isCreatingOrg || superAdminStore.isUpdatingOrg || !form.companyName.trim()"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="superAdminStore.isCreatingOrg || superAdminStore.isUpdatingOrg" class="w-4 h-4 animate-spin" />
              <CheckCircle2 v-else class="w-4 h-4" />
              <span>{{ isEditMode ? 'Save Changes' : 'Create Admin Org' }}</span>
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
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  X,
} from 'lucide-vue-next';
import { useSuperAdminStore } from '../../stores/super-admin.store';
import type { AdminOrgItem } from '../../types/super-admin';

const superAdminStore = useSuperAdminStore();

const searchQuery = ref('');
const isModalOpen = ref(false);
const isEditMode = ref(false);
const activeEditId = ref<string | null>(null);

const form = ref<{
  companyName: string;
  adminUsername: string;
  contactEmail: string;
  workStartTime: string;
  workEndTime: string;
  telegramBotToken: string;
  telegramNotificationChatId: string;
  status: 'ACTIVE' | 'SUSPENDED';
}>({
  companyName: '',
  adminUsername: '',
  contactEmail: '',
  workStartTime: '08:00',
  workEndTime: '17:00',
  telegramBotToken: '',
  telegramNotificationChatId: '',
  status: 'ACTIVE',
});

const filteredOrgs = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return superAdminStore.adminOrgs;
  return superAdminStore.adminOrgs.filter(
    (o) =>
      o.companyName.toLowerCase().includes(query) ||
      o.adminUsername.toLowerCase().includes(query) ||
      o.contactEmail.toLowerCase().includes(query),
  );
});

onMounted(() => {
  superAdminStore.fetchAdminOrgs();
});

function openCreateModal() {
  isEditMode.value = false;
  activeEditId.value = null;
  form.value = {
    companyName: '',
    adminUsername: '',
    contactEmail: '',
    workStartTime: '08:00',
    workEndTime: '17:00',
    telegramBotToken: '',
    telegramNotificationChatId: '',
    status: 'ACTIVE',
  };
  isModalOpen.value = true;
}

function openEditModal(org: AdminOrgItem) {
  isEditMode.value = true;
  activeEditId.value = org.id;
  form.value = {
    companyName: org.companyName || '',
    adminUsername: org.adminUsername || '',
    contactEmail: org.contactEmail || '',
    workStartTime: org.workStartTime || '08:00',
    workEndTime: org.workEndTime || '17:00',
    telegramBotToken: org.telegramBotToken || '',
    telegramNotificationChatId: org.telegramNotificationChatId || '',
    status: org.status || 'ACTIVE',
  };
  isModalOpen.value = true;
}

async function handleSubmit() {
  if (!form.value.companyName.trim()) return;

  let success = false;
  if (isEditMode.value && activeEditId.value) {
    success = await superAdminStore.updateAdminOrg(activeEditId.value, form.value);
  } else {
    success = await superAdminStore.createAdminOrg(form.value);
  }

  if (success) {
    isModalOpen.value = false;
  }
}

async function toggleStatus(org: AdminOrgItem) {
  const newStatus = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
  await superAdminStore.toggleAdminStatus(org.id, newStatus);
}

async function confirmDelete(org: AdminOrgItem) {
  if (confirm(`Are you sure you want to delete Admin Organization "${org.companyName}"?`)) {
    await superAdminStore.deleteAdminOrg(org.id);
  }
}
</script>

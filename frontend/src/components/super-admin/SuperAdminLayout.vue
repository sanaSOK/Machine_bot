<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex font-sans bg-gradient-mesh relative selection:bg-amber-500 selection:text-white">
    <!-- Ambient Background Lighting Orbs -->
    <div class="fixed top-0 left-1/3 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>
    <div class="fixed bottom-0 right-1/4 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>

    <!-- Mobile Drawer Dark Backdrop Overlay -->
    <div
      v-if="isMobileDrawerOpen"
      @click="isMobileDrawerOpen = false"
      class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300"
    ></div>

    <!-- Desktop Collapsible Premium Super Admin Sidebar -->
    <aside
      :class="[
        isSidebarCollapsed ? 'w-20 p-3.5' : 'w-72 p-6',
        'hidden lg:flex bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-900/95 border-r border-amber-500/20 flex-col justify-between backdrop-blur-2xl shrink-0 z-20 shadow-[10px_0_35px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out'
      ]"
    >
      <div>
        <!-- Brand Header with Crown Badge -->
        <div
          :class="[
            isSidebarCollapsed ? 'justify-center flex-col px-0 py-3' : 'px-2 py-4',
            'flex items-center mb-6 border-b border-amber-500/20 gap-3.5 pb-6'
          ]"
        >
          <div class="flex items-center gap-3.5 overflow-hidden group cursor-pointer" @click="router.push('/super-admin')">
            <div class="relative shrink-0">
              <div class="p-2 rounded-2xl bg-gradient-to-br from-amber-500/30 via-purple-500/20 to-slate-900 border border-amber-400/50 shadow-xl glow-amber transition-transform group-hover:scale-105">
                <Crown class="w-7 h-7 text-amber-400" />
              </div>
            </div>

            <!-- Brand Text -->
            <div v-if="!isSidebarCollapsed" class="whitespace-nowrap">
              <h1 class="text-base font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 leading-none">
                SUPER ADMIN
              </h1>
              <span class="inline-block text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full mt-1.5 shadow-sm">
                Global Console 3333
              </span>
            </div>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="space-y-2">
          <!-- Overview -->
          <router-link
            to="/super-admin"
            exact-active-class="nav-item-active"
            :class="[
              isSidebarCollapsed ? 'w-11 h-11 justify-center mx-auto' : 'w-full px-3.5 py-3',
              'flex items-center gap-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent transition-all duration-200 group relative cursor-pointer'
            ]"
            :title="isSidebarCollapsed ? 'Super Admin Overview' : ''"
          >
            <LayoutDashboard class="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
            <span v-if="!isSidebarCollapsed" class="whitespace-nowrap">Overview</span>
            <span v-if="!isSidebarCollapsed" class="ml-auto text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm">
              Global
            </span>
          </router-link>

          <!-- Admin Organizations -->
          <router-link
            to="/super-admin/admins"
            exact-active-class="nav-item-active"
            :class="[
              isSidebarCollapsed ? 'w-11 h-11 justify-center mx-auto' : 'w-full px-3.5 py-3',
              'flex items-center gap-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent transition-all duration-200 group relative cursor-pointer'
            ]"
            :title="isSidebarCollapsed ? 'Admin Organizations' : ''"
          >
            <Building2 class="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
            <span v-if="!isSidebarCollapsed" class="whitespace-nowrap">Admin Orgs</span>
            <span v-if="!isSidebarCollapsed && superAdminStore.adminOrgs.length > 0" class="ml-auto text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm">
              {{ superAdminStore.adminOrgs.length }}
            </span>
          </router-link>
        </nav>
      </div>

      <!-- Footer Actions & Switcher -->
      <div class="pt-5 border-t border-slate-800/80 space-y-3">
        <router-link
          to="/admin"
          :class="[
            isSidebarCollapsed ? 'justify-center p-3' : 'justify-center py-3.5 px-4',
            'flex items-center gap-3 w-full rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 hover:from-indigo-900/40 hover:to-purple-900/40 text-xs font-extrabold text-slate-200 hover:text-white border border-indigo-500/30 hover:border-indigo-400/60 transition-all duration-300 shadow-xl group'
          ]"
          :title="isSidebarCollapsed ? 'Switch to Admin Console' : ''"
        >
          <div class="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 group-hover:scale-110 transition-transform shrink-0">
            <ShieldCheck class="w-4 h-4" />
          </div>
          <span v-if="!isSidebarCollapsed" class="whitespace-nowrap">Switch to Admin Console</span>
        </router-link>

        <div
          :class="[
            isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between p-3.5',
            'rounded-2xl bg-slate-950/80 border border-amber-500/20 flex items-center text-xs shadow-inner'
          ]"
        >
          <span v-if="!isSidebarCollapsed" class="text-slate-400 font-bold text-[11px]">Super Port</span>
          <span class="text-amber-400 font-extrabold flex items-center gap-1.5 text-[11px]">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span v-if="!isSidebarCollapsed">3333 Active</span>
          </span>
        </div>
      </div>
    </aside>

    <!-- Mobile Slide-over Drawer -->
    <aside
      :class="[
        isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full',
        'fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-r border-amber-500/20 p-6 flex flex-col justify-between backdrop-blur-2xl z-50 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden'
      ]"
    >
      <div>
        <div class="flex items-center justify-between px-2 py-3 mb-6 border-b border-amber-500/20 pb-6">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Crown class="w-6 h-6" />
            </div>
            <div>
              <h1 class="text-base font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 leading-none">
                SUPER ADMIN
              </h1>
              <span class="inline-block text-[8px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full mt-1">
                Port 3333
              </span>
            </div>
          </div>

          <button
            @click="isMobileDrawerOpen = false"
            class="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <nav class="space-y-2">
          <router-link
            to="/super-admin"
            @click="isMobileDrawerOpen = false"
            exact-active-class="nav-item-active"
            class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent transition-all relative"
          >
            <LayoutDashboard class="w-5 h-5 shrink-0" />
            <span>Overview</span>
          </router-link>

          <router-link
            to="/super-admin/admins"
            @click="isMobileDrawerOpen = false"
            exact-active-class="nav-item-active"
            class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent transition-all relative"
          >
            <Building2 class="w-5 h-5 shrink-0" />
            <span>Admin Organizations</span>
          </router-link>
        </nav>
      </div>

      <div class="pt-5 border-t border-slate-800/80 space-y-3">
        <router-link
          to="/admin"
          @click="isMobileDrawerOpen = false"
          class="flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-2xl bg-slate-900 text-xs font-extrabold text-slate-200 border border-indigo-500/30 shadow-xl"
        >
          <ShieldCheck class="w-4 h-4 text-indigo-400" />
          <span>Switch to Admin Console</span>
        </router-link>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col min-w-0 overflow-y-auto bg-transparent z-10">
      <!-- Top Bar Header -->
      <header class="h-16 sm:h-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-2xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xl">
        <div class="flex items-center gap-3 sm:gap-4">
          <!-- Mobile Hamburger -->
          <button
            @click="isMobileDrawerOpen = !isMobileDrawerOpen"
            class="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer lg:hidden"
          >
            <Menu class="w-5 h-5 text-amber-400" />
          </button>

          <!-- Desktop Collapse Toggle -->
          <button
            @click="isSidebarCollapsed = !isSidebarCollapsed"
            class="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer hidden lg:flex items-center gap-2 group"
          >
            <PanelLeftOpen v-if="isSidebarCollapsed" class="w-4.5 h-4.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <PanelLeftClose v-else class="w-4.5 h-4.5 text-slate-400 group-hover:scale-110 transition-transform" />
          </button>

          <div class="flex items-center gap-2.5 sm:gap-3">
            <div class="p-2 sm:p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-md">
              <Crown class="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <h2 class="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider">Super Admin Console</h2>
              <p class="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden sm:block">Multi-Tenant Management & System Oversight</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-extrabold text-amber-300 flex items-center gap-2 shadow-inner">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Port 3333 Active</span>
          </div>
        </div>
      </header>

      <!-- Page Container -->
      <div class="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Crown,
  LayoutDashboard,
  Building2,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from 'lucide-vue-next';
import { useSuperAdminStore } from '../../stores/super-admin.store';

const router = useRouter();
const superAdminStore = useSuperAdminStore();
const isSidebarCollapsed = ref(false);
const isMobileDrawerOpen = ref(false);

onMounted(() => {
  superAdminStore.fetchStats();
  superAdminStore.fetchAdminOrgs();
});
</script>

<style scoped>
.nav-item-active {
  background-color: rgba(245, 158, 11, 0.12) !important;
  border-color: rgba(245, 158, 11, 0.35) !important;
  color: #ffffff !important;
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.22) !important;
}

.nav-item-active svg {
  color: #fbbf24 !important;
  filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.6));
}

.nav-item-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  background: #f59e0b;
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 8px #f59e0b;
}
</style>

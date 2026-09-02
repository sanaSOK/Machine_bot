<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex font-sans bg-gradient-mesh relative selection:bg-indigo-500 selection:text-white">
    <!-- Ambient Background Lighting Orbs -->
    <div class="fixed top-0 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="fixed bottom-0 right-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

    <!-- Mobile Drawer Dark Backdrop Overlay -->
    <div
      v-if="isMobileDrawerOpen"
      @click="isMobileDrawerOpen = false"
      class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300"
    ></div>

    <!-- Desktop Collapsible Premium Sidebar (Visible on lg screens) -->
    <aside
      :class="[
        isSidebarCollapsed ? 'w-20 p-3.5' : 'w-72 p-6',
        'hidden lg:flex bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-900/95 border-r border-indigo-500/15 flex-col justify-between backdrop-blur-2xl shrink-0 z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out'
      ]"
    >
      <div>
        <!-- Brand Header with Premium Eroxii Logo Badge -->
        <div
          :class="[
            isSidebarCollapsed ? 'justify-center flex-col px-0 py-3' : 'px-2 py-4',
            'flex items-center mb-6 border-b border-slate-800/80 gap-3.5 pb-6'
          ]"
        >
          <div class="flex items-center gap-3.5 overflow-hidden group cursor-pointer" @click="router.push('/admin')">
            <div class="relative shrink-0">
              <div class="p-1 rounded-2xl bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-slate-900 border border-indigo-400/40 shadow-xl glow-indigo transition-transform group-hover:scale-105">
                <img
                  src="/logo.png"
                  alt="Eroxii Logo"
                  class="w-10 h-10 rounded-xl bg-white p-0.5 object-contain shadow-md"
                />
              </div>
            </div>

            <!-- Brand Text (Hidden when Collapsed) -->
            <div v-if="!isSidebarCollapsed" class="whitespace-nowrap">
              <h1 class="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 leading-none">
                EROXII
              </h1>
              <span class="inline-block text-[9px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full mt-1.5 shadow-sm">
                Attendance Management
              </span>
            </div>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="space-y-2">
          <!-- Dashboard Overview -->
          <router-link
            to="/admin"
            exact-active-class="nav-item-active"
            :class="[
              isSidebarCollapsed ? 'w-11 h-11 justify-center mx-auto' : 'w-full px-3.5 py-3',
              'flex items-center gap-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent transition-all duration-200 group relative cursor-pointer'
            ]"
            :title="isSidebarCollapsed ? 'Dashboard Overview' : ''"
          >
            <LayoutDashboard class="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
            <span v-if="!isSidebarCollapsed" class="whitespace-nowrap">Dashboard Overview</span>
            <span v-if="!isSidebarCollapsed" class="ml-auto text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm">
              Live
            </span>
          </router-link>

          <!-- Users -->
          <router-link
            to="/admin/employees"
            exact-active-class="nav-item-active"
            :class="[
              isSidebarCollapsed ? 'w-11 h-11 justify-center mx-auto' : 'w-full px-3.5 py-3',
              'flex items-center gap-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent transition-all duration-200 group relative cursor-pointer'
            ]"
            :title="isSidebarCollapsed ? 'Users' : ''"
          >
            <Users class="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
            <span v-if="!isSidebarCollapsed" class="whitespace-nowrap">Users</span>
            <span v-if="!isSidebarCollapsed && (adminStore.stats?.totalEmployees ?? 0) > 0" class="ml-auto text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm">
              {{ adminStore.stats?.totalEmployees }}
            </span>
          </router-link>

          <!-- Departments -->
          <router-link
            to="/admin/departments"
            exact-active-class="nav-item-active"
            :class="[
              isSidebarCollapsed ? 'w-11 h-11 justify-center mx-auto' : 'w-full px-3.5 py-3',
              'flex items-center gap-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent transition-all duration-200 group relative cursor-pointer'
            ]"
            :title="isSidebarCollapsed ? 'Departments' : ''"
          >
            <Building2 class="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
            <span v-if="!isSidebarCollapsed" class="whitespace-nowrap">Departments</span>
            <span v-if="!isSidebarCollapsed && adminStore.departments.length > 0" class="ml-auto text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm">
              {{ adminStore.departments.length }}
            </span>
          </router-link>

          <!-- Admin Settings -->
          <router-link
            to="/admin/settings"
            exact-active-class="nav-item-active"
            :class="[
              isSidebarCollapsed ? 'w-11 h-11 justify-center mx-auto' : 'w-full px-3.5 py-3',
              'flex items-center gap-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent transition-all duration-200 group relative cursor-pointer'
            ]"
            :title="isSidebarCollapsed ? 'Admin Settings' : ''"
          >
            <Settings class="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
            <span v-if="!isSidebarCollapsed" class="whitespace-nowrap">Admin Settings</span>
            <span v-if="!isSidebarCollapsed" class="ml-auto text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm">
              Config
            </span>
          </router-link>
        </nav>
      </div>

      <!-- Footer Actions & App Switcher -->
      <div class="pt-5 border-t border-slate-800/80 space-y-3">
        <router-link
          to="/"
          :class="[
            isSidebarCollapsed ? 'justify-center p-3' : 'justify-center py-3.5 px-4',
            'flex items-center gap-3 w-full rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 hover:from-indigo-900/40 hover:to-purple-900/40 text-xs font-extrabold text-slate-200 hover:text-white border border-indigo-500/30 hover:border-indigo-400/60 transition-all duration-300 shadow-xl active:scale-98 group'
          ]"
          :title="isSidebarCollapsed ? 'Switch to Mini App' : ''"
        >
          <div class="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 group-hover:scale-110 transition-transform shrink-0">
            <Smartphone class="w-4 h-4" />
          </div>
          <span v-if="!isSidebarCollapsed" class="whitespace-nowrap">Switch to Mini App</span>
        </router-link>

        <div
          :class="[
            isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between p-3.5',
            'rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center text-xs shadow-inner'
          ]"
        >
          <span v-if="!isSidebarCollapsed" class="text-slate-400 font-bold text-[11px]">System Status</span>
          <span class="text-emerald-400 font-extrabold flex items-center gap-1.5 text-[11px]" :title="isSidebarCollapsed ? 'System Status: Live & Protected' : ''">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span v-if="!isSidebarCollapsed">Live</span>
          </span>
        </div>
      </div>
    </aside>

    <!-- Mobile Slide-over Drawer (Visible on screens < lg) -->
    <aside
      :class="[
        isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full',
        'fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-r border-indigo-500/20 p-6 flex flex-col justify-between backdrop-blur-2xl z-50 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden'
      ]"
    >
      <div>
        <!-- Drawer Header -->
        <div class="flex items-center justify-between px-2 py-3 mb-6 border-b border-slate-800/80 pb-6">
          <div class="flex items-center gap-3">
            <img src="/logo.png" alt="Eroxii Logo" class="w-9 h-9 rounded-xl bg-white p-0.5 object-contain shadow-md" />
            <div>
              <h1 class="text-base font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 leading-none">
                EROXII
              </h1>
              <span class="inline-block text-[8px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full mt-1">
                Attendance Management
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

        <!-- Mobile Nav Links -->
        <nav class="space-y-2">
          <router-link
            to="/admin"
            @click="isMobileDrawerOpen = false"
            exact-active-class="nav-item-active"
            class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent transition-all relative"
          >
            <LayoutDashboard class="w-5 h-5 shrink-0" />
            <span>Dashboard Overview</span>
          </router-link>

          <router-link
            to="/admin/employees"
            @click="isMobileDrawerOpen = false"
            exact-active-class="nav-item-active"
            class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent transition-all relative"
          >
            <Users class="w-5 h-5 shrink-0" />
            <span>Users</span>
          </router-link>

          <router-link
            to="/admin/departments"
            @click="isMobileDrawerOpen = false"
            exact-active-class="nav-item-active"
            class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent transition-all relative"
          >
            <Building2 class="w-5 h-5 shrink-0" />
            <span>Departments</span>
          </router-link>

          <router-link
            to="/admin/settings"
            @click="isMobileDrawerOpen = false"
            exact-active-class="nav-item-active"
            class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent transition-all relative"
          >
            <Settings class="w-5 h-5 shrink-0" />
            <span>Admin Settings</span>
          </router-link>
        </nav>
      </div>

      <div class="pt-5 border-t border-slate-800/80 space-y-3">
        <router-link
          to="/"
          @click="isMobileDrawerOpen = false"
          class="flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-xs font-extrabold text-slate-200 border border-indigo-500/30 shadow-xl"
        >
          <Smartphone class="w-4 h-4 text-indigo-400" />
          <span>Switch to Mini App</span>
        </router-link>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col min-w-0 overflow-y-auto bg-transparent z-10">
      <!-- Top Bar Header -->
      <header class="h-16 sm:h-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-2xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xl">
        <div class="flex items-center gap-3 sm:gap-4">
          <!-- Mobile Hamburger Menu Button (screens < lg) -->
          <button
            @click="isMobileDrawerOpen = !isMobileDrawerOpen"
            class="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer lg:hidden"
            title="Open Mobile Navigation"
          >
            <Menu class="w-5 h-5 text-indigo-400" />
          </button>

          <!-- Desktop Sidebar Collapse Toggle Button (screens >= lg) -->
          <button
            @click="isSidebarCollapsed = !isSidebarCollapsed"
            class="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer hidden lg:flex items-center gap-2 group"
            :title="isSidebarCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar'"
          >
            <PanelLeftOpen v-if="isSidebarCollapsed" class="w-4.5 h-4.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <PanelLeftClose v-else class="w-4.5 h-4.5 text-slate-400 group-hover:scale-110 transition-transform" />
            <span class="text-xs font-bold text-slate-400 hidden xl:inline">{{ isSidebarCollapsed ? 'Expand' : 'Collapse' }}</span>
          </button>

          <div class="flex items-center gap-2.5 sm:gap-3">
            <div class="p-2 sm:p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-md">
              <ShieldCheck class="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <h2 class="text-[11px] sm:text-xs font-extrabold text-white uppercase tracking-wider">Eroxii Admin Console</h2>
              <p class="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden sm:block">Telegram Attendance Security & Live Monitoring</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Server Status Badge -->
          <div class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 shadow-inner">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 glow-emerald animate-pulse"></span>
            <span class="font-extrabold text-[10px] sm:text-xs text-slate-200">Production Ready</span>
          </div>
        </div>
      </header>

      <!-- Page Container (Responsive Padding) -->
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
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  Smartphone,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from 'lucide-vue-next';
import { useAdminStore } from '../../stores/admin.store';

const router = useRouter();
const adminStore = useAdminStore();
const isSidebarCollapsed = ref(false);
const isMobileDrawerOpen = ref(false);

onMounted(() => {
  adminStore.fetchStats();
  adminStore.fetchDepartments();
});
</script>

<style scoped>
.nav-item-active {
  background-color: rgba(99, 102, 241, 0.12) !important;
  border-color: rgba(99, 102, 241, 0.35) !important;
  color: #ffffff !important;
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.22) !important;
}

.nav-item-active svg {
  color: #818cf8 !important;
  filter: drop-shadow(0 0 6px rgba(129, 140, 248, 0.6));
}

.nav-item-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  background: #6366f1;
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 8px #6366f1;
}
</style>

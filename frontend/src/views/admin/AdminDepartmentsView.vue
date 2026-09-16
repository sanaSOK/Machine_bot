<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200 tracking-tight">
          Departments & Roles
        </h2>
        <p class="text-xs text-slate-400 font-medium mt-1">
          Create, manage, and organize company departments and user role tags
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="adminStore.fetchDepartments(); adminStore.fetchEmployees()"
          class="px-4.5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
        >
          <RefreshCw class="w-4 h-4 text-indigo-400" :class="{ 'animate-spin': adminStore.isLoadingDepartments }" />
          <span>Refresh</span>
        </button>

        <button
          @click="isModalOpen = true"
          class="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs transition-all flex items-center gap-2.5 shadow-lg glow-indigo cursor-pointer active:scale-95"
        >
          <Plus class="w-4 h-4 text-white stroke-[3]" />
          <span>Create Department</span>
        </button>
      </div>
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

    <!-- Overview Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <!-- Total Departments -->
      <div class="glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Departments</p>
            <h3 class="text-3xl font-black text-white mt-1.5 font-mono">
              {{ adminStore.departments.length }}
            </h3>
          </div>
          <div class="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner group-hover:scale-110 transition-transform">
            <Building2 class="w-6 h-6" />
          </div>
        </div>
      </div>

      <!-- Total Employees Assigned -->
      <div class="glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned Employees</p>
            <h3 class="text-3xl font-black text-white mt-1.5 font-mono">
              {{ totalAssignedUsers }}
            </h3>
          </div>
          <div class="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-inner group-hover:scale-110 transition-transform">
            <Users class="w-6 h-6" />
          </div>
        </div>
      </div>

      <!-- Most Active Department -->
      <div class="glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Largest Department</p>
            <h3 class="text-xl font-extrabold text-indigo-300 mt-1.5 uppercase truncate max-w-[180px]">
              {{ topDepartment?.name || 'N/A' }}
            </h3>
            <p v-if="topDepartment" class="text-[11px] text-slate-400 mt-0.5 font-medium">
              {{ topDepartment.userCount }} members assigned
            </p>
          </div>
          <div class="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-inner group-hover:scale-110 transition-transform">
            <Award class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Departments Section Header with Card / Grid / Table Switcher -->
    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
          <FolderTree class="w-5 h-5 text-indigo-400" />
          <span>Active Company Departments</span>
        </h3>

        <!-- Layout Mode Switcher Controls -->
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400 font-medium">
            Showing {{ adminStore.departments.length }} departments
          </span>

          <!-- View Mode Toggle Switch (Cards / Grid vs Table / List) -->
          <div class="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-inner">
            <button
              @click="viewMode = 'grid'"
              :class="viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
              class="px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Card / Grid View"
            >
              <LayoutGrid class="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              @click="viewMode = 'table'"
              :class="viewMode === 'table' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
              class="px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Table / List View"
            >
              <List class="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="adminStore.isLoadingDepartments" class="glass-panel p-16 rounded-3xl border border-slate-800/80 text-center space-y-3 shadow-xl">
        <Loader2 class="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Departments...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="adminStore.departments.length === 0" class="glass-panel p-16 rounded-3xl border border-slate-800/80 text-center space-y-4 shadow-xl">
        <div class="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
          <Building2 class="w-7 h-7" />
        </div>
        <h3 class="text-sm font-extrabold text-white">No Departments Configured</h3>
        <p class="text-xs text-slate-400 max-w-xs mx-auto">
          Click the "Create Department" button above to add your first company department.
        </p>
        <button
          @click="isModalOpen = true"
          class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all inline-flex items-center gap-2 shadow-md"
        >
          <Plus class="w-4 h-4" />
          <span>Create Department</span>
        </button>
      </div>

      <!-- 1. GRID / CARDS VIEW MODE -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="dept in adminStore.departments"
          :key="dept.id"
          class="glass-panel rounded-3xl border border-slate-800/80 hover:border-indigo-500/40 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl group relative overflow-hidden"
        >
          <!-- Accent Top Bar -->
          <div
            class="absolute top-0 left-0 right-0 h-1.5 opacity-80"
            :style="{ backgroundColor: dept.color || '#6366f1' }"
          ></div>

          <div>
            <!-- Card Header -->
            <div class="flex items-start justify-between gap-3 mb-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md border border-white/10 shrink-0"
                  :style="{ backgroundColor: dept.color || '#6366f1' }"
                >
                  {{ dept.name.charAt(0) }}
                </div>

                <div>
                  <h4 class="text-base font-black text-white uppercase tracking-wider group-hover:text-indigo-300 transition-colors">
                    {{ dept.name }}
                  </h4>
                  <span class="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Users class="w-3 h-3 text-indigo-400" />
                    {{ dept.userCount || 0 }} members
                  </span>
                </div>
              </div>

              <!-- Actions Group (View, Edit, Delete) -->
              <div class="flex items-center gap-1">
                <!-- View Details -->
                <button
                  @click="openViewDeptModal(dept)"
                  class="p-2 rounded-xl bg-slate-900 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer shadow-sm"
                  title="View Department Details & Members"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>

                <!-- Edit Department -->
                <button
                  @click="openEditDeptModal(dept)"
                  class="p-2 rounded-xl bg-slate-900 hover:bg-amber-600/20 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm"
                  title="Edit Department"
                >
                  <Edit3 class="w-3.5 h-3.5" />
                </button>

                <!-- Delete Department -->
                <button
                  @click="openDeleteDeptModal(dept)"
                  class="p-2 rounded-xl bg-slate-900 hover:bg-red-600/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 transition-all cursor-pointer shadow-sm"
                  title="Delete Department"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Description -->
            <p class="text-xs text-slate-300 font-medium leading-relaxed min-h-[36px]">
              {{ dept.description || 'General organizational department & role tag.' }}
            </p>
          </div>

          <!-- Card Footer -->
          <div class="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between">
            <span class="text-[10px] text-slate-500 font-mono">
              Created: {{ formatDate(dept.createdAt) }}
            </span>

            <router-link
              :to="{ path: '/admin/employees', query: { department: dept.name } }"
              class="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group/btn cursor-pointer"
            >
              <span>View Users</span>
              <ChevronRight class="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </router-link>
          </div>
        </div>
      </div>

      <!-- 2. TABLE / LIST VIEW MODE -->
      <div v-else-if="viewMode === 'table'" class="glass-panel rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
        <div class="overflow-x-auto min-w-full">
          <table class="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr class="border-b border-slate-800/80 bg-slate-950/60 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th class="py-4 px-6">Department Name</th>
                <th class="py-4 px-6">Theme Color</th>
                <th class="py-4 px-6">Description</th>
                <th class="py-4 px-6">Assigned Users</th>
                <th class="py-4 px-6">Created Date</th>
                <th class="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/50 text-xs font-medium">
              <tr
                v-for="dept in adminStore.departments"
                :key="dept.id"
                class="hover:bg-slate-900/40 transition-colors group"
              >
                <!-- Department Name -->
                <td class="py-4 px-6">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md shrink-0 border border-white/10"
                      :style="{ backgroundColor: dept.color || '#6366f1' }"
                    >
                      {{ dept.name.charAt(0) }}
                    </div>
                    <span class="font-extrabold text-white text-sm uppercase group-hover:text-indigo-300 transition-colors">
                      {{ dept.name }}
                    </span>
                  </div>
                </td>

                <!-- Theme Color -->
                <td class="py-4 px-6">
                  <div class="flex items-center gap-2">
                    <span
                      class="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                      :style="{ backgroundColor: dept.color || '#6366f1' }"
                    ></span>
                    <span class="font-mono text-[11px] text-slate-400 uppercase font-bold">{{ dept.color || '#6366f1' }}</span>
                  </div>
                </td>

                <!-- Description -->
                <td class="py-4 px-6 text-slate-300 font-medium max-w-xs truncate">
                  {{ dept.description || 'General organizational department & role tag.' }}
                </td>

                <!-- Assigned Users -->
                <td class="py-4 px-6">
                  <router-link
                    :to="{ path: '/admin/employees', query: { department: dept.name } }"
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-extrabold transition-all group/link"
                  >
                    <Users class="w-3.5 h-3.5 text-indigo-400" />
                    <span>{{ dept.userCount || 0 }} members</span>
                    <ChevronRight class="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                  </router-link>
                </td>

                <!-- Created Date -->
                <td class="py-4 px-6 text-slate-400 font-mono">
                  {{ formatDate(dept.createdAt) }}
                </td>

                <!-- Actions Column -->
                <td class="py-4 px-6 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <!-- View Details -->
                    <button
                      @click="openViewDeptModal(dept)"
                      class="p-2 rounded-xl bg-slate-900 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer shadow-sm"
                      title="View Department Details"
                    >
                      <Eye class="w-3.5 h-3.5" />
                    </button>

                    <!-- Edit Department -->
                    <button
                      @click="openEditDeptModal(dept)"
                      class="p-2 rounded-xl bg-slate-900 hover:bg-amber-600/20 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm"
                      title="Edit Department"
                    >
                      <Edit3 class="w-3.5 h-3.5" />
                    </button>

                    <!-- Delete Department -->
                    <button
                      @click="openDeleteDeptModal(dept)"
                      class="p-2 rounded-xl bg-slate-900 hover:bg-red-600/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 transition-all cursor-pointer shadow-sm"
                      title="Delete Department"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 1. VIEW DEPARTMENT DETAILS MODAL -->
    <div v-if="isViewModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div class="glass-panel w-full max-w-2xl rounded-3xl border border-slate-800 p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <div
              class="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-md border border-white/10"
              :style="{ backgroundColor: viewingDept?.color || '#6366f1' }"
            >
              {{ viewingDept?.name.charAt(0) }}
            </div>
            <div>
              <h3 class="text-lg font-black text-white uppercase tracking-wider">{{ viewingDept?.name }} Department</h3>
              <p class="text-xs text-slate-400 font-medium">Department Details & Member Roster</p>
            </div>
          </div>
          <button @click="isViewModalOpen = false" class="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Details Info Card -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Theme Color</span>
            <div class="flex items-center gap-2">
              <span class="w-4 h-4 rounded-full border border-white/20" :style="{ backgroundColor: viewingDept?.color || '#6366f1' }"></span>
              <span class="font-mono text-xs text-white font-bold">{{ viewingDept?.color }}</span>
            </div>
          </div>
          <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Members</span>
            <p class="text-xl font-black text-indigo-400">{{ viewingDept?.userCount || 0 }} Employees</p>
          </div>
          <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Created Date</span>
            <p class="text-xs font-mono text-slate-300 font-bold">{{ formatDate(viewingDept?.createdAt) }}</p>
          </div>
        </div>

        <!-- Description -->
        <div class="p-4 rounded-2xl bg-slate-950 border border-slate-900 space-y-1">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</span>
          <p class="text-xs text-slate-300 leading-relaxed font-medium">
            {{ viewingDept?.description || 'General company department & role tag.' }}
          </p>
        </div>

        <!-- Member Employees Roster List -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Users class="w-4 h-4 text-indigo-400" />
              <span>Assigned Employees ({{ deptMembers.length }})</span>
            </h4>

            <router-link
              v-if="viewingDept"
              :to="{ path: '/admin/employees', query: { department: viewingDept.name } }"
              @click="isViewModalOpen = false"
              class="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
            >
              <span>Manage in Users Directory</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </router-link>
          </div>

          <div v-if="deptMembers.length === 0" class="p-8 text-center text-xs text-slate-500 font-medium rounded-2xl bg-slate-950 border border-slate-900">
            No employees currently assigned to this department.
          </div>

          <div v-else class="space-y-2 max-h-56 overflow-y-auto pr-1">
            <div
              v-for="user in deptMembers"
              :key="user.id"
              class="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div class="flex items-center gap-3">
                <img
                  v-if="user.photo_url"
                  :src="user.photo_url"
                  :alt="user.first_name"
                  class="w-8 h-8 rounded-xl object-cover border border-indigo-400/30 shrink-0"
                />
                <div
                  v-else
                  class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-indigo-400/30 flex items-center justify-center text-white font-bold text-xs shrink-0"
                >
                  {{ user.first_name?.charAt(0) || 'U' }}
                </div>
                <div>
                  <p class="font-bold text-white text-xs">{{ user.first_name }} {{ user.last_name || '' }}</p>
                  <p class="text-[10px] text-slate-400 font-mono">{{ formatUsername(user.username) }} | ID: {{ user.telegram_user_id }}</p>
                </div>
              </div>

              <span
                class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase border"
                :class="user.is_active ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-red-500/15 text-red-300 border-red-500/30'"
              >
                {{ user.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end pt-4 border-t border-slate-800">
          <button @click="isViewModalOpen = false" class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- 2. EDIT DEPARTMENT MODAL -->
    <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div class="glass-panel w-full max-w-lg rounded-3xl border border-slate-800 p-6 space-y-6 shadow-2xl">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Edit3 class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-lg font-black text-white">Edit Department</h3>
              <p class="text-xs text-slate-400 font-medium">Update department name, description & theme color</p>
            </div>
          </div>
          <button @click="isEditModalOpen = false" class="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSaveDepartment" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Department Name <span class="text-red-400">*</span>
            </label>
            <input
              v-model="editDeptForm.name"
              type="text"
              required
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-white uppercase focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              v-model="editDeptForm.description"
              rows="3"
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 resize-none"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Theme Color
            </label>
            <div class="flex items-center gap-2.5 flex-wrap">
              <button
                v-for="color in presetColors"
                :key="color"
                type="button"
                @click="editDeptForm.color = color"
                class="w-8 h-8 rounded-xl border-2 transition-transform cursor-pointer"
                :class="editDeptForm.color === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'"
                :style="{ backgroundColor: color }"
              ></button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              @click="isEditModalOpen = false"
              class="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSavingDept || !editDeptForm.name.trim()"
              class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Loader2 v-if="isSavingDept" class="w-4 h-4 animate-spin" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 3. DELETE DEPARTMENT CONFIRMATION MODAL -->
    <div v-if="isDeleteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div class="glass-panel w-full max-w-md rounded-3xl border border-red-500/30 p-6 space-y-6 shadow-2xl">
        <!-- Modal Header -->
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <Trash2 class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-lg font-black text-white">Delete Department?</h3>
            <p class="text-xs text-slate-400 font-medium">This action cannot be undone</p>
          </div>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
          Are you sure you want to delete department <strong class="text-white font-black">{{ deletingDept?.name }}</strong>? Removing this department tag will unassign its members.
        </p>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            @click="isDeleteModalOpen = false"
            class="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="handleConfirmDeleteDept"
            :disabled="isDeletingDept"
            class="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Loader2 v-if="isDeletingDept" class="w-4 h-4 animate-spin" />
            <span>Yes, Delete Department</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Create Department Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
    >
      <div
        class="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
      >
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Building2 class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-lg font-black text-white">Create Department</h3>
              <p class="text-xs text-slate-400 font-medium">Add a new department & user role tag</p>
            </div>
          </div>
          <button
            @click="isModalOpen = false"
            class="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleCreateDepartment" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Department Name <span class="text-red-400">*</span>
            </label>
            <input
              v-model="newDeptName"
              type="text"
              required
              placeholder="e.g. TEACHER, ELECTRICAL, IT, HR"
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-white uppercase placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Description (Optional)
            </label>
            <textarea
              v-model="newDeptDesc"
              rows="3"
              placeholder="Brief description of roles and duties in this department..."
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Theme Color
            </label>
            <div class="flex items-center gap-2.5 flex-wrap">
              <button
                v-for="color in presetColors"
                :key="color"
                type="button"
                @click="newDeptColor = color"
                class="w-8 h-8 rounded-xl border-2 transition-transform cursor-pointer"
                :class="newDeptColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'"
                :style="{ backgroundColor: color }"
              ></button>
            </div>
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
              :disabled="adminStore.isCreatingDepartment || !newDeptName.trim()"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <Loader2 v-if="adminStore.isCreatingDepartment" class="w-4 h-4 animate-spin" />
              <Plus v-else class="w-4 h-4 stroke-[3]" />
              <span>Create Department</span>
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
  Users,
  Award,
  FolderTree,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  X,
  LayoutGrid,
  List,
  Eye,
  Edit3,
} from 'lucide-vue-next';
import { useAdminStore } from '../../stores/admin.store';
import type { DepartmentItem } from '../../types/admin';

const adminStore = useAdminStore();

function formatUsername(username?: string | null): string {
  if (!username) return 'no username';
  const clean = username.trim().replace(/^@/, '');
  if (!clean || clean === 'no_username') return 'no username';
  return `@${clean}`;
}

// View Mode Toggle State ('grid' / Cards vs 'table' / List)
const viewMode = ref<'grid' | 'table'>('grid');

// Create Modal State
const isModalOpen = ref(false);
const newDeptName = ref('');
const newDeptDesc = ref('');
const newDeptColor = ref('#6366f1');

// View Dept Modal State
const isViewModalOpen = ref(false);
const viewingDept = ref<DepartmentItem | null>(null);

// Edit Dept Modal State
const isEditModalOpen = ref(false);
const isSavingDept = ref(false);
const editDeptForm = ref({
  id: '',
  name: '',
  description: '',
  color: '#6366f1',
});

// Delete Dept Modal State
const isDeleteModalOpen = ref(false);
const deletingDept = ref<DepartmentItem | null>(null);
const isDeletingDept = ref(false);

const presetColors = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#38bdf8', // Sky
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#14b8a6', // Teal
];

const totalAssignedUsers = computed(() => {
  return adminStore.departments.reduce((sum, d) => sum + (d.userCount || 0), 0);
});

const topDepartment = computed(() => {
  if (adminStore.departments.length === 0) return null;
  return [...adminStore.departments].sort((a, b) => (b.userCount || 0) - (a.userCount || 0))[0];
});

const deptMembers = computed(() => {
  if (!viewingDept.value) return [];
  const target = viewingDept.value.name.toUpperCase();
  return adminStore.employees.filter((e) => (e.role || '').toUpperCase() === target);
});

onMounted(() => {
  adminStore.fetchDepartments();
  adminStore.fetchEmployees();
});

async function handleCreateDepartment() {
  if (!newDeptName.value.trim()) return;

  const success = await adminStore.createDepartment({
    name: newDeptName.value.trim(),
    description: newDeptDesc.value.trim(),
    color: newDeptColor.value,
  });

  if (success) {
    isModalOpen.value = false;
    newDeptName.value = '';
    newDeptDesc.value = '';
    newDeptColor.value = '#6366f1';
  }
}

function openViewDeptModal(dept: DepartmentItem) {
  viewingDept.value = dept;
  isViewModalOpen.value = true;
}

function openEditDeptModal(dept: DepartmentItem) {
  editDeptForm.value = {
    id: dept.id,
    name: dept.name,
    description: dept.description || '',
    color: dept.color || '#6366f1',
  };
  isEditModalOpen.value = true;
}

async function handleSaveDepartment() {
  if (!editDeptForm.value.name.trim()) return;
  isSavingDept.value = true;

  const ok = await adminStore.updateDepartment(editDeptForm.value.id, {
    name: editDeptForm.value.name,
    description: editDeptForm.value.description,
    color: editDeptForm.value.color,
  });

  isSavingDept.value = false;
  if (ok) {
    isEditModalOpen.value = false;
    adminStore.fetchEmployees();
  }
}

function openDeleteDeptModal(dept: DepartmentItem) {
  deletingDept.value = dept;
  isDeleteModalOpen.value = true;
}

async function handleConfirmDeleteDept() {
  if (!deletingDept.value) return;
  isDeletingDept.value = true;
  const ok = await adminStore.deleteDepartment(deletingDept.value.id);
  isDeletingDept.value = false;
  if (ok) {
    isDeleteModalOpen.value = false;
    deletingDept.value = null;
    adminStore.fetchEmployees();
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

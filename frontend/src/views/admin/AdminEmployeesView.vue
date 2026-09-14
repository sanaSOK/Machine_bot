<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200 tracking-tight">
          Users Management
        </h2>
        <p class="text-xs text-slate-400 font-medium mt-1">
          Registered Telegram accounts, role management, user details, active status control, and check-in history
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

    <!-- Search & Department Filter Controls Bar -->
    <div class="glass-panel p-5 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
        <!-- Search Input -->
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

        <!-- Department Filter Dropdown -->
        <div class="relative w-full sm:w-56">
          <div class="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <Building2 class="w-4 h-4 text-indigo-400" />
          </div>
          <select
            :value="adminStore.employeeFilters.department || ''"
            @change="onDepartmentFilterChange(($event.target as HTMLSelectElement).value)"
            class="w-full pl-10 pr-8 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Departments</option>
            <option
              v-for="dept in adminStore.departments"
              :key="dept.id"
              :value="dept.name"
              class="bg-slate-900 text-white font-bold"
            >
              {{ dept.name }} ({{ dept.userCount || 0 }})
            </option>
          </select>
          <ChevronDown class="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <!-- Active Department Filter Pill Badge -->
      <div v-if="adminStore.employeeFilters.department" class="flex items-center gap-2 shrink-0">
        <span class="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-extrabold shadow-sm">
          <Building2 class="w-4 h-4 text-indigo-400" />
          <span>Department: {{ adminStore.employeeFilters.department }}</span>
          <button
            @click="clearDepartmentFilter"
            class="hover:text-white p-0.5 ml-1 rounded-lg hover:bg-indigo-500/30 transition-colors cursor-pointer"
            title="Clear Department Filter"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </span>
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
        <table class="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr class="border-b border-slate-800/80 bg-slate-950/60 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <th class="py-4 px-6">ID</th>
              <th class="py-4 px-6">User</th>
              <th class="py-4 px-6">Telegram ID</th>
              <th class="py-4 px-6">Department / Role</th>
              <th class="py-4 px-6">Today Status</th>
              <th class="py-4 px-6">Account Status</th>
              <th class="py-4 px-6">Total Check-ins</th>
              <th class="py-4 px-6 text-center">Actions</th>
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

              <!-- Role / Department Selector -->
              <td class="py-4.5 px-6">
                <div class="relative inline-flex items-center group min-w-[140px] max-w-[180px]">
                  <select
                    :value="editingRoles[user.id] !== undefined ? editingRoles[user.id] : (user.role || 'EMPLOYEE')"
                    @change="onRoleSelectChange(user, ($event.target as HTMLSelectElement).value)"
                    :disabled="updatingUserId === user.id"
                    class="pl-3 pr-7 py-1.5 rounded-xl text-[11px] font-extrabold tracking-wider uppercase border shadow-inner transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 w-full appearance-none bg-slate-950 text-indigo-200 border-slate-700 focus:border-indigo-500 cursor-pointer"
                  >
                    <option
                      v-for="dept in adminStore.departments"
                      :key="dept.id"
                      :value="dept.name"
                      class="bg-slate-900 text-white font-bold"
                    >
                      {{ dept.name }}
                    </option>
                    <option
                      v-if="user.role && !adminStore.departments.some(d => d.name.toUpperCase() === user.role.toUpperCase())"
                      :value="user.role"
                      class="bg-slate-900 text-indigo-300 font-bold"
                    >
                      {{ user.role }}
                    </option>
                  </select>
                  <ChevronDown class="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 shrink-0" />
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

              <!-- Account Active Status -->
              <td class="py-4.5 px-6 whitespace-nowrap">
                <button
                  @click="handleToggleStatus(user)"
                  :disabled="togglingUserId === user.id"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold border transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                  :class="user.is_active ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25' : 'bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25'"
                  :title="user.is_active ? 'Click to Deactivate user' : 'Click to Activate user'"
                >
                  <Loader2 v-if="togglingUserId === user.id" class="w-3 h-3 animate-spin" />
                  <UserCheck v-else-if="user.is_active" class="w-3 h-3 text-emerald-400 shrink-0" />
                  <UserX v-else class="w-3 h-3 text-red-400 shrink-0" />
                  <span>{{ user.is_active ? 'ACTIVE' : 'INACTIVE' }}</span>
                </button>
              </td>

              <!-- Total Check-ins -->
              <td class="py-4.5 px-6 font-bold text-white text-sm">
                {{ user.totalAttendances || 0 }}
              </td>

              <!-- User Actions Column -->
              <td class="py-4.5 px-6">
                <div class="flex items-center justify-center gap-1.5">
                  <!-- View Details Button -->
                  <button
                    @click="openViewUserModal(user)"
                    class="p-2 rounded-xl bg-slate-900 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer shadow-sm"
                    title="View User Details & History"
                  >
                    <Eye class="w-3.5 h-3.5" />
                  </button>

                  <!-- Edit User Button -->
                  <button
                    @click="openEditUserModal(user)"
                    class="p-2 rounded-xl bg-slate-900 hover:bg-amber-600/20 text-slate-400 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm"
                    title="Edit User Profile"
                  >
                    <Edit3 class="w-3.5 h-3.5" />
                  </button>

                  <!-- Delete User Button -->
                  <button
                    @click="openDeleteConfirmModal(user)"
                    class="p-2 rounded-xl bg-slate-900 hover:bg-red-600/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 transition-all cursor-pointer shadow-sm"
                    title="Delete User"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
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

    <!-- 1. VIEW USER DETAILS MODAL -->
    <div v-if="isViewModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div class="glass-panel w-full max-w-2xl rounded-3xl border border-slate-800 p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Eye class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-lg font-black text-white">User Details & History</h3>
              <p class="text-xs text-slate-400 font-medium">User Profile #{{ viewingUser?.id }}</p>
            </div>
          </div>
          <button @click="isViewModalOpen = false" class="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoadingUserDetails" class="py-12 text-center space-y-3">
          <Loader2 class="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
          <p class="text-xs font-bold text-slate-400">Fetching user history...</p>
        </div>

        <div v-else-if="userDetailsData" class="space-y-6">
          <!-- Profile Card Header -->
          <div class="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <img
              v-if="userDetailsData.user?.photo_url"
              :src="userDetailsData.user.photo_url"
              :alt="userDetailsData.user.first_name"
              class="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg"
            />
            <div
              v-else
              class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 border-2 border-indigo-400/40 flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0"
            >
              {{ userDetailsData.user?.first_name?.charAt(0) || 'U' }}
            </div>

            <div class="flex-1 text-center sm:text-left space-y-1">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h4 class="text-base font-extrabold text-white">
                  {{ userDetailsData.user?.first_name }} {{ userDetailsData.user?.last_name || '' }}
                </h4>
                <span
                  class="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border"
                  :class="userDetailsData.user?.is_active ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-red-500/15 text-red-300 border-red-500/30'"
                >
                  {{ userDetailsData.user?.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <p class="text-xs font-mono text-indigo-300">@{{ userDetailsData.user?.username || 'no_username' }}</p>
              <p class="text-[11px] text-slate-400 font-mono">Telegram ID: <span class="text-slate-200 font-bold">{{ userDetailsData.user?.telegram_user_id }}</span></p>
            </div>

            <div class="shrink-0 text-center sm:text-right">
              <span class="inline-block px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-extrabold text-xs border border-indigo-500/30 uppercase">
                {{ userDetailsData.user?.role || 'EMPLOYEE' }}
              </span>
              <p class="text-[10px] text-slate-400 mt-1">Joined: {{ formatDate(userDetailsData.user?.created_at) }}</p>
            </div>
          </div>

          <!-- Total Check-ins Stats Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Check-In Logs</span>
              <p class="text-2xl font-black text-emerald-400">{{ userDetailsData.totalLogs || 0 }}</p>
            </div>
            <div class="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Address</span>
              <p class="text-xs font-semibold text-slate-300 truncate max-w-[200px] mx-auto">{{ userDetailsData.user?.address || 'Not specified' }}</p>
            </div>
          </div>

          <!-- Recent Attendance Activity Logs -->
          <div class="space-y-3">
            <h4 class="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock class="w-4 h-4 text-indigo-400" />
              <span>Recent Attendance Activity</span>
            </h4>

            <div v-if="!userDetailsData.recentLogs || userDetailsData.recentLogs.length === 0" class="p-6 text-center text-xs text-slate-500 font-medium rounded-2xl bg-slate-950 border border-slate-900">
              No attendance activity recorded for this user yet.
            </div>

            <div v-else class="space-y-2 max-h-56 overflow-y-auto pr-1">
              <div
                v-for="log in userDetailsData.recentLogs"
                :key="log.id"
                class="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs gap-3"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase border"
                    :class="log.action === 'CHECK_IN' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-sky-500/15 text-sky-300 border-sky-500/30'"
                  >
                    {{ log.action === 'CHECK_IN' ? 'IN' : 'OUT' }}
                  </span>
                  <div>
                    <p class="font-bold text-white text-xs">{{ formatDateTime(log.created_at) }}</p>
                    <p v-if="log.address" class="text-[10px] text-slate-400 line-clamp-1 max-w-xs">{{ log.address }}</p>
                  </div>
                </div>

                <a
                  v-if="log.photo_url"
                  :href="log.photo_url"
                  target="_blank"
                  class="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
                >
                  View Photo
                </a>
              </div>
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

    <!-- 2. EDIT USER MODAL -->
    <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div class="glass-panel w-full max-w-lg rounded-3xl border border-slate-800 p-6 space-y-6 shadow-2xl">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Edit3 class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-lg font-black text-white">Edit User Profile</h3>
              <p class="text-xs text-slate-400 font-medium">Update account details for #{{ editForm.id }}</p>
            </div>
          </div>
          <button @click="isEditModalOpen = false" class="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Form Body -->
        <form @submit.prevent="handleSaveUser" class="space-y-4">
          <!-- First Name & Last Name Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300">First Name <span class="text-red-400">*</span></label>
              <input
                v-model="editForm.first_name"
                type="text"
                required
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-300">Last Name</label>
              <input
                v-model="editForm.last_name"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <!-- Telegram Username -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">Telegram Username</label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 text-slate-500 font-mono text-xs">@</span>
              <input
                v-model="editForm.username"
                type="text"
                placeholder="username"
                class="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <!-- Department / Role Dropdown -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">Department / Role</label>
            <select
              v-model="editForm.role"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
            >
              <option v-for="dept in adminStore.departments" :key="dept.id" :value="dept.name" class="bg-slate-900">
                {{ dept.name }}
              </option>
              <option v-if="editForm.role && !adminStore.departments.some(d => d.name.toUpperCase() === editForm.role.toUpperCase())" :value="editForm.role" class="bg-slate-900">
                {{ editForm.role }}
              </option>
            </select>
          </div>

          <!-- Address -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-300">Registered Address</label>
            <textarea
              v-model="editForm.address"
              rows="2"
              placeholder="Physical office / work location address"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20"
            ></textarea>
          </div>

          <!-- Account Active Status Toggle -->
          <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span class="text-xs font-bold text-white">Account Status</span>
              <p class="text-[11px] text-slate-400">Allow or restrict user access to attendance check-in</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="editForm.is_active" class="sr-only peer" />
              <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
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
              :disabled="isSavingUser"
              class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Loader2 v-if="isSavingUser" class="w-4 h-4 animate-spin" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 3. DELETE USER CONFIRMATION MODAL -->
    <div v-if="isDeleteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div class="glass-panel w-full max-w-md rounded-3xl border border-red-500/30 p-6 space-y-6 shadow-2xl">
        <!-- Modal Header -->
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <Trash2 class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-lg font-black text-white">Delete User Account?</h3>
            <p class="text-xs text-slate-400 font-medium">This action cannot be undone</p>
          </div>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
          Are you sure you want to delete user <strong class="text-white font-black">{{ deletingUser?.first_name }} {{ deletingUser?.last_name || '' }}</strong> (ID: #{{ deletingUser?.id }})? This will permanently remove their profile and attendance history logs.
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
            @click="handleConfirmDelete"
            :disabled="isDeleting"
            class="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin" />
            <span>Yes, Delete User</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  RefreshCw,
  Loader2,
  Users,
  Building2,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  X,
  Eye,
  Edit3,
  Trash2,
  UserCheck,
  UserX,
  Clock,
} from 'lucide-vue-next';
import { useAdminStore } from '../../stores/admin.store';
import type { AdminUser } from '../../types/admin';

const route = useRoute();
const router = useRouter();
const adminStore = useAdminStore();

const updatingUserId = ref<number | null>(null);
const togglingUserId = ref<number | null>(null);
const editingRoles = ref<Record<number, string>>({});

// View User Modal State
const isViewModalOpen = ref(false);
const viewingUser = ref<AdminUser | null>(null);
const isLoadingUserDetails = ref(false);
const userDetailsData = ref<{ user: AdminUser; totalLogs: number; recentLogs: any[] } | null>(null);

// Edit User Modal State
const isEditModalOpen = ref(false);
const isSavingUser = ref(false);
const editForm = ref({
  id: 0,
  first_name: '',
  last_name: '',
  username: '',
  role: 'EMPLOYEE',
  address: '',
  is_active: true,
});

// Delete User Modal State
const isDeleteModalOpen = ref(false);
const deletingUser = ref<AdminUser | null>(null);
const isDeleting = ref(false);

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

function onDepartmentFilterChange(deptName: string) {
  adminStore.employeeFilters.department = deptName || '';
  adminStore.employeeFilters.offset = 0;
  adminStore.fetchEmployees();

  if (deptName) {
    router.replace({ query: { ...route.query, department: deptName } });
  } else {
    const { department, ...queryWithoutDept } = route.query;
    router.replace({ query: queryWithoutDept });
  }
}

function clearDepartmentFilter() {
  onDepartmentFilterChange('');
}

watch(
  () => route.query.department,
  (newDept) => {
    const deptStr = (newDept as string) || '';
    adminStore.employeeFilters.department = deptStr;
    adminStore.employeeFilters.offset = 0;
    adminStore.fetchEmployees();
  },
  { immediate: true },
);

async function onRoleSelectChange(user: AdminUser, newRole: string) {
  if (!newRole || newRole.trim().toUpperCase() === (user.role || '').toUpperCase()) return;
  updatingUserId.value = user.id;
  const ok = await adminStore.updateUserRole(user.id, newRole.trim().toUpperCase());
  if (ok) {
    adminStore.fetchDepartments();
  }
  updatingUserId.value = null;
}

async function handleToggleStatus(user: AdminUser) {
  togglingUserId.value = user.id;
  await adminStore.toggleUserStatus(user.id, !user.is_active);
  togglingUserId.value = null;
}

async function openViewUserModal(user: AdminUser) {
  viewingUser.value = user;
  isViewModalOpen.value = true;
  isLoadingUserDetails.value = true;
  userDetailsData.value = null;

  const data = await adminStore.fetchUserDetails(user.id);
  userDetailsData.value = data;
  isLoadingUserDetails.value = false;
}

function openEditUserModal(user: AdminUser) {
  editForm.value = {
    id: user.id,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    username: user.username || '',
    role: user.role || 'EMPLOYEE',
    address: user.address || '',
    is_active: !!user.is_active,
  };
  isEditModalOpen.value = true;
}

async function handleSaveUser() {
  if (!editForm.value.first_name.trim()) return;
  isSavingUser.value = true;

  const ok = await adminStore.updateUser(editForm.value.id, {
    first_name: editForm.value.first_name,
    last_name: editForm.value.last_name,
    username: editForm.value.username,
    role: editForm.value.role,
    address: editForm.value.address,
    is_active: editForm.value.is_active,
  });

  isSavingUser.value = false;
  if (ok) {
    isEditModalOpen.value = false;
    adminStore.fetchEmployees();
    adminStore.fetchDepartments();
  }
}

function openDeleteConfirmModal(user: AdminUser) {
  deletingUser.value = user;
  isDeleteModalOpen.value = true;
}

async function handleConfirmDelete() {
  if (!deletingUser.value) return;
  isDeleting.value = true;
  const ok = await adminStore.deleteUser(deletingUser.value.id);
  isDeleting.value = false;
  if (ok) {
    isDeleteModalOpen.value = false;
    deletingUser.value = null;
    adminStore.fetchEmployees();
  }
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

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

onMounted(() => {
  adminStore.fetchSettings();
  adminStore.fetchEmployees();
  adminStore.fetchDepartments();
});
</script>

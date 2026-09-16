import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CameraView from '../views/CameraView.vue';
import HistoryView from '../views/HistoryView.vue';
import AdminLoginView from '../views/AdminLoginView.vue';
import VerifyEmailView from '../views/VerifyEmailView.vue';

import AdminLayout from '../components/admin/AdminLayout.vue';
import AdminDashboardView from '../views/admin/AdminDashboardView.vue';
import AdminEmployeesView from '../views/admin/AdminEmployeesView.vue';
import AdminDepartmentsView from '../views/admin/AdminDepartmentsView.vue';
import AdminSettingsView from '../views/admin/AdminSettingsView.vue';

import SuperAdminLayout from '../components/super-admin/SuperAdminLayout.vue';
import SuperAdminDashboardView from '../views/super-admin/SuperAdminDashboardView.vue';
import SuperAdminOrgsView from '../views/super-admin/SuperAdminOrgsView.vue';

import { useAuthStore } from '../stores/auth.store';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/camera',
      name: 'camera',
      component: CameraView,
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: AdminLoginView,
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: VerifyEmailView,
    },
    {
      path: '/api/auth/verify-email',
      name: 'api-verify-email-redirect',
      redirect: (to) => {
        return { path: '/verify-email', query: to.query };
      },
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAdmin: true },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: AdminDashboardView,
        },
        {
          path: 'employees',
          name: 'admin-employees',
          component: AdminEmployeesView,
        },
        {
          path: 'departments',
          name: 'admin-departments',
          component: AdminDepartmentsView,
        },
        {
          path: 'settings',
          name: 'admin-settings',
          component: AdminSettingsView,
        },
      ],
    },
    {
      path: '/super-admin',
      component: SuperAdminLayout,
      meta: { requiresSuperAdmin: true },
      children: [
        {
          path: '',
          name: 'super-admin-dashboard',
          component: SuperAdminDashboardView,
        },
        {
          path: 'admins',
          name: 'super-admin-orgs',
          component: SuperAdminOrgsView,
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresSuperAdmin) {
    if (!authStore.isAuthenticated || !authStore.isSuperAdmin) {
      return next('/admin/login');
    }
  } else if (to.meta.requiresAdmin) {
    if (!authStore.isAuthenticated || !authStore.isAdmin) {
      return next('/admin/login');
    }
  }

  next();
});

export default router;

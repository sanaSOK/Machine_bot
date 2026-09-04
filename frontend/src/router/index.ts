import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CameraView from '../views/CameraView.vue';
import HistoryView from '../views/HistoryView.vue';
import AdminLayout from '../components/admin/AdminLayout.vue';
import AdminDashboardView from '../views/admin/AdminDashboardView.vue';
import AdminEmployeesView from '../views/admin/AdminEmployeesView.vue';
import AdminDepartmentsView from '../views/admin/AdminDepartmentsView.vue';
import AdminSettingsView from '../views/admin/AdminSettingsView.vue';

import SuperAdminLayout from '../components/super-admin/SuperAdminLayout.vue';
import SuperAdminDashboardView from '../views/super-admin/SuperAdminDashboardView.vue';
import SuperAdminOrgsView from '../views/super-admin/SuperAdminOrgsView.vue';

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
      path: '/admin',
      component: AdminLayout,
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
      redirect: () => {
        if (typeof window !== 'undefined' && window.location) {
          if (window.location.port === '3333') return '/super-admin';
          if (window.location.port === '5555') return '/admin';
        }
        return '/';
      },
    },
  ],
});

export default router;

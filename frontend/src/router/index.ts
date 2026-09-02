import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CameraView from '../views/CameraView.vue';
import HistoryView from '../views/HistoryView.vue';
import AdminLayout from '../components/admin/AdminLayout.vue';
import AdminDashboardView from '../views/admin/AdminDashboardView.vue';
import AdminEmployeesView from '../views/admin/AdminEmployeesView.vue';
import AdminSettingsView from '../views/admin/AdminSettingsView.vue';

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
          path: 'settings',
          name: 'admin-settings',
          component: AdminSettingsView,
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

export default router;

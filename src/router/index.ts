import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '@/core/layouts/MainLayout.vue';
import DashboardHome from '@/core/views/DashboardHome.vue';
import { getRoutes } from '@/core/pluginLoader';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '', // Default view
          name: 'home',
          component: DashboardHome,
        },
        // Spread the plugin routes here so they render INSIDE MainLayout
        ...getRoutes() 
      ],
    },
  ],
});

export default router;
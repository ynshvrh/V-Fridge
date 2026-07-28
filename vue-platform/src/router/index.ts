import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('@/views/auth/SignUpView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/verify-email',
      name: 'VerifyEmail',
      component: () => import('@/views/auth/VerifyEmailView.vue')
    },
    {
      path: '/invite',
      name: 'Invite',
      component: () => import('@/views/InviteView.vue')
    },
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/fridges',
      redirect: '/?tab=fridges'
    },
    {
      path: '/shopping',
      redirect: '/?tab=shopping'
    },
    {
      path: '/planner',
      redirect: '/recipes?tab=planner'
    },
    {
      path: '/analytics',
      name: 'Analytics',
      component: () => import('@/views/AnalyticsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/nutrition',
      name: 'Nutrition',
      component: () => import('@/views/NutritionView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/recipes',
      name: 'Recipes',
      component: () => import('@/views/RecipeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true }
    }
  ]
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  if (!authStore.user && localStorage.getItem('vfridge_access_token')) {
    await authStore.fetchCurrentUser();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login' });
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;

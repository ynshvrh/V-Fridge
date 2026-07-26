<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { 
  Refrigerator, 
  ShoppingCart, 
  UtensilsCrossed, 
  BarChart3, 
  LogOut, 
  User as UserIcon,
  ChefHat
} from '@lucide/vue';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<template>
  <header class="navbar-header">
    <div class="navbar-container">
      <router-link to="/" class="brand-logo">
        <div class="logo-icon-bg">
          <Refrigerator class="logo-icon" :size="22" />
        </div>
        <span class="brand-name">V-Fridge</span>
      </router-link>

      <nav v-if="authStore.isAuthenticated" class="nav-links">
        <router-link to="/" class="nav-item" active-class="active">
          <Refrigerator :size="18" />
          <span>Inventory</span>
        </router-link>
        <router-link to="/shopping" class="nav-item" active-class="active">
          <ShoppingCart :size="18" />
          <span>Shopping</span>
        </router-link>
        <router-link to="/planner" class="nav-item" active-class="active">
          <ChefHat :size="18" />
          <span>AI Planner</span>
        </router-link>
        <router-link to="/analytics" class="nav-item" active-class="active">
          <BarChart3 :size="18" />
          <span>Analytics</span>
        </router-link>
        <router-link to="/fridges" class="nav-item" active-class="active">
          <UtensilsCrossed :size="18" />
          <span>Fridges</span>
        </router-link>
      </nav>

      <div v-if="authStore.isAuthenticated" class="user-actions">
        <router-link to="/settings" class="user-pill">
          <div class="avatar-box">
            <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" alt="Avatar" class="avatar-img" />
            <UserIcon v-else :size="16" />
          </div>
          <span class="user-name">{{ authStore.user?.username }}</span>
        </router-link>
        <button class="logout-btn" title="Logout" @click="handleLogout">
          <LogOut :size="18" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-glass);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-subtle);
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.logo-icon-bg {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-purple-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: var(--shadow-glow);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  transition: var(--transition-fast);
}

.nav-item:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  color: var(--text-primary);
  background: rgba(140, 83, 131, 0.2);
  border: 1px solid rgba(140, 83, 131, 0.3);
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 6px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
  transition: var(--transition-fast);
}

.user-pill:hover {
  background: rgba(255, 255, 255, 0.08);
}

.avatar-box {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent-purple);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #fff;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.logout-btn {
  color: var(--text-secondary);
  padding: 8px;
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
}

.logout-btn:hover {
  color: var(--accent-rose);
  background: rgba(244, 63, 94, 0.1);
}
</style>

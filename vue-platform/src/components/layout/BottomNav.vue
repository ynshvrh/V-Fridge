<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { 
  Refrigerator, 
  ChefHat, 
  Activity, 
  Settings 
} from '@lucide/vue';

const authStore = useAuthStore();
</script>

<template>
  <nav v-if="authStore.isAuthenticated" class="bottom-nav">
    <div class="bottom-nav-container">
      <router-link to="/" class="nav-item" active-class="active">
        <div class="icon-wrapper">
          <Refrigerator :size="20" />
        </div>
        <span class="nav-label">Сховище</span>
      </router-link>

      <router-link to="/recipes" class="nav-item" active-class="active">
        <div class="icon-wrapper">
          <ChefHat :size="20" />
        </div>
        <span class="nav-label">Кулінарія</span>
      </router-link>

      <router-link to="/nutrition" class="nav-item" active-class="active">
        <div class="icon-wrapper">
          <Activity :size="20" />
        </div>
        <span class="nav-label">Калорії</span>
      </router-link>

      <router-link to="/settings" class="nav-item" active-class="active">
        <div class="icon-wrapper">
          <Settings :size="20" />
        </div>
        <span class="nav-label">Налаштування</span>
      </router-link>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--bg-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid var(--border-subtle);
  padding: 6px 12px calc(env(safe-area-inset-bottom, 0px) + 6px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .bottom-nav {
    display: block;
  }
}

.bottom-nav-container {
  display: flex;
  align-items: center;
  justify-content: space-around;
  max-width: 600px;
  margin: 0 auto;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1;
  padding: 6px 0;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 48px; /* Touch target size */
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  border-radius: 14px;
  transition: all 0.2s ease;
}

.nav-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  transition: color 0.2s ease;
}

.nav-item:hover {
  color: var(--text-primary);
}

.nav-item.active {
  color: var(--accent-orange);
}

.nav-item.active .icon-wrapper {
  background: var(--accent-orange-bg);
  color: var(--accent-orange);
  transform: translateY(-2px);
}
</style>

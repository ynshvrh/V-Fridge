<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { useRouter } from 'vue-router';
import { 
  Refrigerator, 
  ShoppingCart, 
  ChefHat, 
  BarChart3, 
  UtensilsCrossed, 
  LogOut, 
  User as UserIcon,
  Sun,
  Moon,
  Menu,
  X,
  Settings,
  Activity
} from '@lucide/vue';

const authStore = useAuthStore();
const themeStore = useThemeStore();
const router = useRouter();

const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const handleLogout = async () => {
  closeMobileMenu();
  await authStore.logout();
  router.push('/login');
};
</script>

<template>
  <header class="navbar-header">
    <div class="navbar-container">
      <!-- Brand Logo -->
      <router-link to="/" class="brand-logo" @click="closeMobileMenu">
        <div class="logo-icon-bg">
          <Refrigerator class="logo-icon" :size="20" />
        </div>
        <span class="brand-name">V-Fridge</span>
      </router-link>

      <!-- Desktop Navigation -->
      <nav v-if="authStore.isAuthenticated" class="desktop-nav-links">
        <router-link to="/" class="nav-item" active-class="active">
          <Refrigerator :size="18" />
          <span>Інвентар</span>
        </router-link>
        <router-link to="/shopping" class="nav-item" active-class="active">
          <ShoppingCart :size="18" />
          <span>Покупки</span>
        </router-link>
        <router-link to="/planner" class="nav-item" active-class="active">
          <ChefHat :size="18" />
          <span>AI Шеф</span>
        </router-link>
        <router-link to="/analytics" class="nav-item" active-class="active">
          <BarChart3 :size="18" />
          <span>Аналітика</span>
        </router-link>
        <router-link to="/nutrition" class="nav-item" active-class="active">
          <Activity :size="18" />
          <span>Калорії</span>
        </router-link>
        <router-link to="/fridges" class="nav-item" active-class="active">
          <UtensilsCrossed :size="18" />
          <span>Холодильники</span>
        </router-link>
      </nav>

      <!-- User Actions & Theme Toggle (Desktop & Mobile trigger) -->
      <div class="right-actions">
        <!-- Theme Toggle -->
        <button 
          class="theme-toggle-btn" 
          :title="themeStore.theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'"
          @click="themeStore.toggleTheme"
        >
          <Sun v-if="themeStore.theme === 'dark'" :size="18" />
          <Moon v-else :size="18" />
        </button>

        <template v-if="authStore.isAuthenticated">
          <!-- Desktop User Profile Pill -->
          <router-link to="/settings" class="user-pill desktop-only">
            <div class="avatar-box">
              <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" alt="Avatar" class="avatar-img" />
              <UserIcon v-else :size="16" />
            </div>
            <span class="user-name">{{ authStore.user?.username }}</span>
          </router-link>

          <!-- Desktop Logout -->
          <button class="logout-btn desktop-only" title="Вийти" @click="handleLogout">
            <LogOut :size="18" />
          </button>

          <!-- Mobile Hamburger Menu Button -->
          <button class="hamburger-btn mobile-only" @click="toggleMobileMenu" aria-label="Меню">
            <X v-if="isMobileMenuOpen" :size="22" />
            <Menu v-else :size="22" />
          </button>
        </template>
      </div>
    </div>

    <!-- Mobile Navigation Drawer -->
    <transition name="drawer">
      <div v-if="isMobileMenuOpen && authStore.isAuthenticated" class="mobile-drawer-overlay" @click.self="closeMobileMenu">
        <div class="mobile-drawer-content">
          <div class="drawer-header">
            <div class="user-info-mobile">
              <div class="avatar-box">
                <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" alt="Avatar" class="avatar-img" />
                <UserIcon v-else :size="18" />
              </div>
              <div class="user-text">
                <span class="user-name-mobile">{{ authStore.user?.username }}</span>
                <span class="user-email-mobile">{{ authStore.user?.email }}</span>
              </div>
            </div>
            <button class="close-btn" @click="closeMobileMenu">
              <X :size="20" />
            </button>
          </div>

          <nav class="mobile-nav-links">
            <router-link to="/" class="mobile-nav-item" active-class="active" @click="closeMobileMenu">
              <Refrigerator :size="20" />
              <span>Інвентар</span>
            </router-link>
            <router-link to="/shopping" class="mobile-nav-item" active-class="active" @click="closeMobileMenu">
              <ShoppingCart :size="20" />
              <span>Покупки</span>
            </router-link>
            <router-link to="/planner" class="mobile-nav-item" active-class="active" @click="closeMobileMenu">
              <ChefHat :size="20" />
              <span>AI Шеф</span>
            </router-link>
            <router-link to="/analytics" class="mobile-nav-item" active-class="active" @click="closeMobileMenu">
              <BarChart3 :size="20" />
              <span>Аналітика</span>
            </router-link>
            <router-link to="/nutrition" class="mobile-nav-item" active-class="active" @click="closeMobileMenu">
              <Activity :size="20" />
              <span>Калорії</span>
            </router-link>
            <router-link to="/fridges" class="mobile-nav-item" active-class="active" @click="closeMobileMenu">
              <UtensilsCrossed :size="20" />
              <span>Холодильники</span>
            </router-link>
            <router-link to="/settings" class="mobile-nav-item" active-class="active" @click="closeMobileMenu">
              <Settings :size="20" />
              <span>Налаштування</span>
            </router-link>
          </nav>

          <div class="drawer-footer">
            <button class="mobile-logout-btn" @click="handleLogout">
              <LogOut :size="18" />
              <span>Вийти з акаунту</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<style scoped>
.navbar-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-subtle);
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 20px;
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
  background: var(--accent-orange);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: var(--shadow-glow);
}

.desktop-nav-links {
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
  background: var(--border-subtle);
}

.nav-item.active {
  color: #ffffff;
  background: var(--accent-orange);
  box-shadow: 0 2px 10px var(--accent-orange-glow);
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: var(--text-primary);
  background: var(--border-subtle);
  transition: var(--transition-fast);
}

.theme-toggle-btn:hover {
  background: var(--accent-orange-bg);
  color: var(--accent-orange);
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 6px;
  border-radius: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  transition: var(--transition-fast);
}

.user-pill:hover {
  border-color: var(--accent-orange);
}

.avatar-box {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent-orange);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #ffffff;
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
  color: var(--status-expired);
  background: var(--status-expired-bg);
}

.hamburger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  color: var(--text-primary);
}

/* Mobile responsive rules */
.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .desktop-only, .desktop-nav-links {
    display: none !important;
  }
  .mobile-only {
    display: flex;
  }
}

/* Off-canvas Mobile Drawer */
.mobile-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  justify-content: flex-end;
}

.mobile-drawer-content {
  width: 280px;
  height: 100%;
  background: var(--bg-primary);
  border-left: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-shadow: var(--shadow-card);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.user-info-mobile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-text {
  display: flex;
  flex-direction: column;
}

.user-name-mobile {
  font-size: 0.95rem;
  font-weight: 600;
}

.user-email-mobile {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.close-btn {
  color: var(--text-secondary);
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
  flex: 1;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.95rem;
}

.mobile-nav-item.active {
  color: #ffffff;
  background: var(--accent-orange);
}

.drawer-footer {
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}

.mobile-logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border-radius: var(--radius-md);
  background: var(--status-expired-bg);
  color: var(--status-expired);
  font-weight: 600;
}

/* Drawer Animation */
.drawer-enter-active, .drawer-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-enter-active .mobile-drawer-content,
.drawer-leave-active .mobile-drawer-content {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from, .drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .mobile-drawer-content,
.drawer-leave-to .mobile-drawer-content {
  transform: translateX(100%);
}
</style>

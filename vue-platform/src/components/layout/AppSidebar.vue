<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { useI18n } from '@/i18n';
import FridgeSelector from '@/components/fridge/FridgeSelector.vue';
import CreateFridgeModal from '@/components/fridge/CreateFridgeModal.vue';
import {
  LayoutDashboard,
  Refrigerator,
  ShoppingCart,
  CalendarDays,
  ChefHat,
  Flame,
  BarChart3,
  Users,
  Settings,
  Sun,
  Moon,
  LogOut,
  Globe,
  X
} from '@lucide/vue';

defineProps<{
  isMobileOpen?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close-mobile'): void;
}>();

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const { t, locale, setLocale } = useI18n();

const showCreateModal = ref(false);

const navItems = computed(() => [
  { path: '/', label: t('navDashboard'), icon: LayoutDashboard, exact: true },
  { path: '/shopping', label: t('navShopping'), icon: ShoppingCart },
  { path: '/planner', label: t('navPlanner'), icon: CalendarDays },
  { path: '/recipes', label: t('navChef'), icon: ChefHat },
  { path: '/nutrition', label: t('navNutrition'), icon: Flame },
  { path: '/analytics', label: t('analyticsTitle') || 'Аналітика', icon: BarChart3 },
  { path: '/fridges', label: t('fridgesTabTitle') || 'Холодильники', icon: Users },
  { path: '/settings', label: t('navSettings'), icon: Settings },
]);

const isActive = (path: string, exact = false) => {
  if (exact) {
    return route.path === path;
  }
  return route.path.startsWith(path);
};

const handleNavClick = () => {
  emit('close-mobile');
};

const handleLogout = async () => {
  emit('close-mobile');
  await authStore.logout();
  router.push('/login');
};

const toggleLocale = () => {
  setLocale(locale.value === 'uk' ? 'en' : 'uk');
};
</script>

<template>
  <div>
    <!-- Desktop Sidebar -->
    <aside class="sidebar-desktop">
      <!-- Sidebar Header / Brand -->
      <div class="sidebar-header">
        <router-link to="/" class="brand-link">
          <div class="brand-icon-box">
            <Refrigerator :size="18" />
          </div>
          <div class="brand-text">
            <h1 class="brand-title">V-Fridge</h1>
            <span class="brand-tag">Smart Kitchen</span>
          </div>
        </router-link>
      </div>

      <!-- Fridge Selector -->
      <div v-if="authStore.isAuthenticated" class="sidebar-section fridge-section">
        <FridgeSelector @open-create-modal="showCreateModal = true" />
      </div>

      <!-- Main Navigation Menu -->
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-link', isActive(item.path, item.exact) ? 'active' : '']"
        >
          <component :is="item.icon" :size="17" class="nav-icon" />
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer">
        <div class="footer-controls">
          <button
            class="control-btn"
            :title="locale === 'uk' ? 'Switch to English' : 'Перемкнути на українську'"
            @click="toggleLocale"
          >
            <Globe :size="14" />
            <span>{{ locale === 'uk' ? 'УКР' : 'ENG' }}</span>
          </button>

          <button
            class="control-btn"
            :title="themeStore.theme === 'dark' ? 'Світла тема' : 'Темна тема'"
            @click="themeStore.toggleTheme"
          >
            <Sun v-if="themeStore.theme === 'dark'" :size="14" />
            <Moon v-else :size="14" />
            <span>{{ themeStore.theme === 'dark' ? 'Light' : 'Dark' }}</span>
          </button>
        </div>

        <div v-if="authStore.isAuthenticated" class="user-card">
          <div class="user-info">
            <div class="user-avatar">
              {{ (authStore.user?.username || authStore.user?.email || 'U')[0].toUpperCase() }}
            </div>
            <div class="user-meta">
              <span class="user-name">{{ authStore.user?.username || t('settingsTitle') }}</span>
              <span class="user-email">{{ authStore.user?.email }}</span>
            </div>
          </div>
          <button class="logout-btn" :title="t('settingsSignOut')" @click="handleLogout">
            <LogOut :size="16" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Drawer Overlay -->
    <transition name="drawer-fade">
      <div
        v-if="isMobileOpen"
        class="mobile-drawer-overlay"
        @click.self="emit('close-mobile')"
      >
        <aside class="sidebar-mobile">
          <div class="mobile-header">
            <router-link to="/" class="brand-link" @click="handleNavClick">
              <div class="brand-icon-box">
                <Refrigerator :size="18" />
              </div>
              <div class="brand-text">
                <h2 class="brand-title">V-Fridge</h2>
                <span class="brand-tag">Smart Kitchen</span>
              </div>
            </router-link>
            <button class="close-btn" @click="emit('close-mobile')">
              <X :size="20" />
            </button>
          </div>

          <div v-if="authStore.isAuthenticated" class="mobile-fridge">
            <FridgeSelector @open-create-modal="showCreateModal = true" />
          </div>

          <nav class="sidebar-nav mobile-nav">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              :class="['nav-link', isActive(item.path, item.exact) ? 'active' : '']"
              @click="handleNavClick"
            >
              <component :is="item.icon" :size="18" class="nav-icon" />
              <span class="nav-label">{{ item.label }}</span>
            </router-link>
          </nav>

          <div class="sidebar-footer">
            <div class="footer-controls">
              <button
                class="control-btn"
                @click="toggleLocale"
              >
                <Globe :size="14" />
                <span>{{ locale === 'uk' ? 'УКР' : 'ENG' }}</span>
              </button>

              <button
                class="control-btn"
                @click="themeStore.toggleTheme"
              >
                <Sun v-if="themeStore.theme === 'dark'" :size="14" />
                <Moon v-else :size="14" />
                <span>{{ themeStore.theme === 'dark' ? 'Light' : 'Dark' }}</span>
              </button>
            </div>

            <div v-if="authStore.isAuthenticated" class="user-card">
              <div class="user-info">
                <div class="user-avatar">
                  {{ (authStore.user?.username || authStore.user?.email || 'U')[0].toUpperCase() }}
                </div>
                <div class="user-meta">
                  <span class="user-name">{{ authStore.user?.username || 'User' }}</span>
                  <span class="user-email">{{ authStore.user?.email }}</span>
                </div>
              </div>
              <button class="logout-btn" :title="t('settingsSignOut')" @click="handleLogout">
                <LogOut :size="16" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </transition>

    <!-- Create Fridge Modal -->
    <CreateFridgeModal v-if="showCreateModal" @close="showCreateModal = false" />
  </div>
</template>

<style scoped>
/* Desktop Sidebar */
.sidebar-desktop {
  width: 250px;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  flex-shrink: 0;
  z-index: 40;
}

@media (max-width: 900px) {
  .sidebar-desktop {
    display: none;
  }
}

.sidebar-header {
  padding: 18px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon-box {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--text-primary);
}

.brand-tag {
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.sidebar-section {
  padding: 12px 14px 4px;
}

.fridge-section :deep(.fridge-selector) {
  width: 100%;
}

.fridge-section :deep(.selector-btn) {
  width: 100%;
  justify-content: space-between;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
}

.fridge-section :deep(.active-badge) {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  background: var(--primary);
  color: var(--primary-foreground);
}

.fridge-section :deep(.active-name) {
  font-size: 0.82rem;
  font-weight: 600;
}

/* Nav Menu */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 500;
  transition: var(--transition-fast);
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.nav-link.active {
  color: var(--primary);
  background: var(--primary-subtle);
  font-weight: 600;
}

.nav-icon {
  flex-shrink: 0;
  color: inherit;
}

/* Footer */
.sidebar-footer {
  padding: 12px 14px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 600;
  transition: var(--transition-fast);
  border: 1px solid var(--border-subtle);
}

.control-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.7rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  color: var(--text-muted);
  padding: 4px;
  border-radius: 4px;
  transition: var(--transition-fast);
}

.logout-btn:hover {
  color: var(--status-expired);
  background: var(--status-expired-bg);
}

/* Mobile Drawer */
.mobile-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
}

.sidebar-mobile {
  width: 280px;
  max-width: 85vw;
  height: 100%;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.mobile-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
}

.close-btn {
  color: var(--text-secondary);
  padding: 4px;
}

.mobile-fridge {
  padding: 12px 14px 4px;
}

.mobile-nav {
  gap: 4px;
}

.drawer-fade-enter-active, .drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-fade-enter-from, .drawer-fade-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useFridgeStore } from '@/stores/fridge';
import { useProductStore } from '@/stores/product';
import FridgeSelector from '@/components/fridge/FridgeSelector.vue';
import ProductCard from '@/components/fridge/ProductCard.vue';
import AddProductModal from '@/components/fridge/AddProductModal.vue';
import CreateFridgeModal from '@/components/fridge/CreateFridgeModal.vue';
import ShoppingTab from '@/components/shopping/ShoppingTab.vue';
import FridgesTab from '@/components/fridge/FridgesTab.vue';
import { 
  Refrigerator, 
  ShoppingCart, 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Package 
} from '@lucide/vue';

const route = useRoute();
const fridgeStore = useFridgeStore();
const productStore = useProductStore();

const initialTab = (route.query.tab as 'inventory' | 'shopping' | 'fridges') || 'inventory';
const activeTab = ref<'inventory' | 'shopping' | 'fridges'>(initialTab);

const searchQuery = ref('');
const selectedCategory = ref('all');
const showAddModal = ref(false);
const showCreateFridgeModal = ref(false);

const categories = [
  'all', 'dairy', 'fruits', 'vegetables', 'meat', 'poultry', 
  'seafood', 'bakery', 'beverages', 'condiments', 'other'
];

onMounted(async () => {
  await fridgeStore.fetchFridges();
  await productStore.fetchProducts();
});

const filteredProducts = computed(() => {
  return productStore.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.value.toLowerCase()));
    const matchesCategory = selectedCategory.value === 'all' || p.category === selectedCategory.value;
    return matchesSearch && matchesCategory;
  });
});

const handleEmptyFridge = async () => {
  if (confirm('Ви впевнені, що хочете очистити весь холодильник? Всі продукти будуть видалені.')) {
    await productStore.deleteAllProducts();
  }
};
</script>

<template>
  <div class="dashboard-page fade-in">
    <!-- Top Consolidated Nav Bar for Storage Hub -->
    <div class="top-nav-bar">
      <div class="tab-buttons">
        <button
          :class="['tab-btn', activeTab === 'inventory' ? 'active' : '']"
          @click="activeTab = 'inventory'"
        >
          <Refrigerator :size="18" />
          <span>Інвентар</span>
        </button>

        <button
          :class="['tab-btn', activeTab === 'shopping' ? 'active' : '']"
          @click="activeTab = 'shopping'"
        >
          <ShoppingCart :size="18" />
          <span>Покупки</span>
        </button>

        <button
          :class="['tab-btn', activeTab === 'fridges' ? 'active' : '']"
          @click="activeTab = 'fridges'"
        >
          <Users :size="18" />
          <span>Спільні холодильники</span>
        </button>
      </div>
    </div>

    <!-- Tab 1: Inventory -->
    <div v-if="activeTab === 'inventory'" class="tab-content">
      <header class="page-header">
        <div class="header-left">
          <FridgeSelector @open-create-modal="showCreateFridgeModal = true" />
          <span v-if="fridgeStore.activeFridge" class="role-badge">
            {{ fridgeStore.activeFridge.role }}
          </span>
        </div>

        <div class="header-right">
          <button v-if="productStore.products.length > 0" class="btn-destructive" @click="handleEmptyFridge">
            <Trash2 :size="16" />
            <span>Очистити</span>
          </button>
          <button class="btn-primary" @click="showAddModal = true">
            <Plus :size="18" />
            <span>Додати товар</span>
          </button>
        </div>
      </header>

      <div v-if="productStore.products.length > 0" class="controls-bar glass-card">
        <div class="search-box">
          <Search :size="16" class="search-icon" />
          <input v-model="searchQuery" type="text" class="search-input" placeholder="Пошук продуктів..." />
        </div>

        <div class="category-filter">
          <button
            v-for="cat in categories"
            :key="cat"
            class="cat-tab"
            :class="{ active: selectedCategory === cat }"
            @click="selectedCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <div v-if="productStore.loading" class="loading-state glass-card">
        <Package class="spin-icon" :size="32" />
        <p>Завантаження інвентарю...</p>
      </div>

      <div v-else-if="!fridgeStore.activeFridge" class="empty-state glass-card">
        <div class="empty-icon-bg">
          <Refrigerator :size="36" />
        </div>
        <h3>Холодильники не знайдені</h3>
        <p>Створіть свій перший холодильник для відстеження продуктів.</p>
        <button class="btn-primary" style="margin-top: 16px;" @click="showCreateFridgeModal = true">
          <Plus :size="18" />
          <span>Створити холодильник</span>
        </button>
      </div>

      <div v-else-if="filteredProducts.length === 0" class="empty-state glass-card">
        <div class="empty-icon-bg">
          <Package :size="36" />
        </div>
        <h3>Продуктів не знайдено</h3>
        <p>У цьому холодильнику ще немає товарів за обраними фільтрами.</p>
        <button class="btn-primary" style="margin-top: 16px;" @click="showAddModal = true">
          <Plus :size="18" />
          <span>Додати товар</span>
        </button>
      </div>

      <div v-else class="products-grid">
        <ProductCard
          v-for="product in filteredProducts"
          :key="product.id"
          :product="product"
        />
      </div>

      <AddProductModal v-if="showAddModal" @close="showAddModal = false" />
      <CreateFridgeModal v-if="showCreateFridgeModal" @close="showCreateFridgeModal = false" />
    </div>

    <!-- Tab 2: Shopping -->
    <div v-else-if="activeTab === 'shopping'" class="tab-content">
      <ShoppingTab />
    </div>

    <!-- Tab 3: Shared Fridges -->
    <div v-else class="tab-content">
      <FridgesTab />
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 6px;
}

.tab-buttons {
  display: flex;
  gap: 6px;
  width: 100%;
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.88rem;
  font-weight: 700;
  transition: var(--transition-fast);
}

.tab-btn.active {
  background: var(--accent-orange);
  color: #ffffff;
  box-shadow: 0 2px 10px var(--accent-orange-glow);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-badge {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--accent-orange-bg);
  color: var(--accent-orange);
}

.controls-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.search-icon {
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.category-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.category-filter::-webkit-scrollbar {
  display: none;
}

.cat-tab {
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 0.78rem;
  text-transform: capitalize;
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  white-space: nowrap;
  transition: var(--transition-fast);
}

.cat-tab:hover {
  background: var(--border-subtle);
  color: var(--text-primary);
}

.cat-tab.active {
  background: var(--accent-orange);
  color: #ffffff;
  border-color: var(--accent-orange);
}

.loading-state, .empty-state {
  padding: 48px 20px;
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spin-icon {
  color: var(--accent-orange);
  margin-bottom: 12px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.empty-icon-bg {
  width: 56px;
  height: 56px;
  margin-bottom: 14px;
  border-radius: 50%;
  background: var(--accent-orange-bg);
  color: var(--accent-orange);
  display: flex;
  align-items: center;
  justify-content: center;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

@media (max-width: 640px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}
</style>

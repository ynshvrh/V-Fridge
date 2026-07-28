<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFridgeStore } from '@/stores/fridge';
import { useProductStore } from '@/stores/product';
import FridgeSelector from '@/components/fridge/FridgeSelector.vue';
import ProductCard from '@/components/fridge/ProductCard.vue';
import AddProductModal from '@/components/fridge/AddProductModal.vue';
import CreateFridgeModal from '@/components/fridge/CreateFridgeModal.vue';
import { Plus, Search, Trash2, Refrigerator, Package } from '@lucide/vue';

const fridgeStore = useFridgeStore();
const productStore = useProductStore();

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
      <h3>{{ searchQuery || selectedCategory !== 'all' ? 'Немає продуктів за вашим фільтром' : 'Ваш холодильник порожній' }}</h3>
      <p v-if="!searchQuery && selectedCategory === 'all'">Додайте товари, щоб стежити за їх терміном придатності та кількістю.</p>
    </div>

    <div v-else class="products-grid">
      <ProductCard v-for="product in filteredProducts" :key="product.id" :product="product" />
    </div>

    <AddProductModal v-if="showAddModal" @close="showAddModal = false" />
    <CreateFridgeModal v-if="showCreateFridgeModal" @close="showCreateFridgeModal = false" />
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-badge {
  font-size: 0.72rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: 12px;
  background: var(--accent-blue-bg);
  color: var(--accent-blue);
  border: 1px solid rgba(164, 225, 255, 0.3);
}

.controls-bar {
  padding: 10px 14px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: sticky;
  top: 64px;
  z-index: 90;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  padding: 8px 14px 8px 36px;
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.88rem;
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

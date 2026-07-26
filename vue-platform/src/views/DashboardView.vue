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
  if (confirm('Are you sure you want to empty the entire fridge? All items will be logged as consumed/wasted.')) {
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
        <button v-if="productStore.products.length > 0" class="btn-secondary danger-btn" @click="handleEmptyFridge">
          <Trash2 :size="16" />
          <span>Empty Fridge</span>
        </button>
        <button class="btn-primary" @click="showAddModal = true">
          <Plus :size="18" />
          <span>Add Product</span>
        </button>
      </div>
    </header>

    <div v-if="productStore.products.length > 0" class="controls-bar glass-card">
      <div class="search-box">
        <Search :size="18" class="search-icon" />
        <input v-model="searchQuery" type="text" class="search-input" placeholder="Search items..." />
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
      <p>Loading inventory...</p>
    </div>

    <div v-else-if="!fridgeStore.activeFridge" class="empty-state glass-card">
      <div class="empty-icon-bg">
        <Refrigerator :size="36" />
      </div>
      <h3>No Fridges Found</h3>
      <p>Create your first fridge to start tracking food inventory.</p>
      <button class="btn-primary" style="margin-top: 16px;" @click="showCreateFridgeModal = true">
        <Plus :size="18" />
        <span>Create Fridge</span>
      </button>
    </div>

    <div v-else-if="filteredProducts.length === 0" class="empty-state glass-card">
      <div class="empty-icon-bg">
        <Package :size="36" />
      </div>
      <h3>{{ searchQuery || selectedCategory !== 'all' ? 'No items match your filter' : 'Your fridge is empty' }}</h3>
      <p v-if="!searchQuery && selectedCategory === 'all'">Add items to track expiry dates and quantities.</p>
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
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-badge {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(140, 83, 131, 0.15);
  color: var(--accent-purple-hover);
  border: 1px solid var(--border-strong);
}

.danger-btn:hover {
  border-color: rgba(244, 63, 94, 0.4);
  color: var(--accent-rose);
}

.controls-bar {
  padding: 12px 16px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  padding: 10px 16px 10px 42px;
  background: rgba(15, 14, 23, 0.6);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
}

.category-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.cat-tab {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  text-transform: capitalize;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  white-space: nowrap;
  transition: var(--transition-fast);
}

.cat-tab:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.cat-tab.active {
  background: var(--accent-purple-glow);
  color: var(--text-primary);
  border-color: var(--accent-purple-hover);
}

.loading-state, .empty-state {
  padding: 64px 24px;
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spin-icon {
  color: var(--accent-purple);
  margin-bottom: 12px;
}

.empty-icon-bg {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  border-radius: 50%;
  background: rgba(140, 83, 131, 0.15);
  color: var(--accent-purple-hover);
  display: flex;
  align-items: center;
  justify-content: center;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}
</style>

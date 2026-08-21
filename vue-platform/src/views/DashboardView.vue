<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFridgeStore } from '@/stores/fridge';
import { useProductStore } from '@/stores/product';
import ProductCard from '@/components/fridge/ProductCard.vue';
import AddProductModal from '@/components/fridge/AddProductModal.vue';
import CreateFridgeModal from '@/components/fridge/CreateFridgeModal.vue';
import { 
  Plus, 
  Search, 
  Trash2, 
  Package,
  SlidersHorizontal
} from '@lucide/vue';

const fridgeStore = useFridgeStore();
const productStore = useProductStore();

const searchQuery = ref('');
const selectedCategory = ref('all');
const showAddModal = ref(false);
const showCreateFridgeModal = ref(false);

const categories = [
  { id: 'all', label: 'Всі товари' },
  { id: 'prepared-meals', label: 'Готові страви' },
  { id: 'dairy', label: 'Молочне' },
  { id: 'meat-fish', label: 'М\'ясо та риба' },
  { id: 'vegetables', label: 'Овочі та зелень' },
  { id: 'fruits', label: 'Фрукти та ягоди' },
  { id: 'bakery', label: 'Випічка' },
  { id: 'pantry', label: 'Бакалія' },
  { id: 'sauces', label: 'Соуси та спеції' },
  { id: 'drinks', label: 'Напої' },
  { id: 'frozen', label: 'Заморозка' },
  { id: 'canned-prepared', label: 'Консерви' },
  { id: 'snacks', label: 'Снеки' },
  { id: 'other', label: 'Інше' }
];

onMounted(async () => {
  await fridgeStore.fetchFridges();
  await productStore.fetchProducts();
});

const filteredProducts = computed(() => {
  return productStore.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.value.toLowerCase()));
    const matchesCategory = selectedCategory.value === 'all' || p.category.toLowerCase() === selectedCategory.value.toLowerCase();
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
    <!-- Header Controls -->
    <header class="inventory-header">
      <div class="header-titles">
        <h2 class="section-heading">Інвентар продуктів</h2>
        <p class="section-subheading">
          У холодильнику: <strong class="text-strong">{{ productStore.products.length }}</strong> шт.
        </p>
      </div>

      <div class="header-actions">
        <button
          v-if="productStore.products.length > 0"
          class="btn-destructive btn-sm"
          @click="handleEmptyFridge"
        >
          <Trash2 :size="15" />
          <span>Очистити</span>
        </button>

        <button class="btn-primary btn-sm" @click="showAddModal = true">
          <Plus :size="16" />
          <span>Додати продукт</span>
        </button>
      </div>
    </header>

    <!-- Search and Filter Bar -->
    <div class="controls-panel nordic-card">
      <div class="search-box">
        <Search :size="15" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Пошук за назвою або описом..."
        />
      </div>

      <div class="category-scroll">
        <button
          v-for="cat in categories"
          :key="cat.id"
          :class="['cat-chip', selectedCategory === cat.id ? 'active' : '']"
          @click="selectedCategory = cat.id"
        >
          <span>{{ cat.label }}</span>
        </button>
      </div>
    </div>

    <!-- Content States -->
    <div v-if="productStore.loading" class="loading-state nordic-card">
      <Package class="spin-icon" :size="28" />
      <p>Завантаження продуктів...</p>
    </div>

    <div v-else-if="!fridgeStore.activeFridge" class="empty-state nordic-card">
      <div class="empty-icon-box">
        <SlidersHorizontal :size="24" />
      </div>
      <h3>Немає активного холодильника</h3>
      <p>Створіть свій перший холодильник для організації продуктів.</p>
      <button class="btn-primary" style="margin-top: 14px;" @click="showCreateFridgeModal = true">
        <Plus :size="16" />
        <span>Створити холодильник</span>
      </button>
    </div>

    <div v-else-if="filteredProducts.length === 0" class="empty-state nordic-card">
      <div class="empty-icon-box">
        <Package :size="24" />
      </div>
      <h3>Продуктів не знайдено</h3>
      <p v-if="searchQuery || selectedCategory !== 'all'">
        Спробуйте змінити фільтри або пошуковий запит.
      </p>
      <p v-else>
        Холодильник порожній. Додайте перші продукти для контролю свіжості.
      </p>
      <button class="btn-primary" style="margin-top: 14px;" @click="showAddModal = true">
        <Plus :size="16" />
        <span>Додати перший продукт</span>
      </button>
    </div>

    <div v-else class="products-grid">
      <ProductCard
        v-for="product in filteredProducts"
        :key="product.id"
        :product="product"
      />
    </div>

    <!-- Modals -->
    <AddProductModal v-if="showAddModal" @close="showAddModal = false" />
    <CreateFridgeModal v-if="showCreateFridgeModal" @close="showCreateFridgeModal = false" />
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.inventory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.section-heading {
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.section-subheading {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.text-strong {
  color: var(--text-primary);
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-sm {
  padding: 7px 12px;
  font-size: 0.82rem;
}

.controls-panel {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.85rem;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.category-scroll {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.cat-chip {
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  font-size: 0.76rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  white-space: nowrap;
  transition: var(--transition-fast);
}

.cat-chip:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.cat-chip.active {
  background: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
  font-weight: 600;
}

.loading-state, .empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spin-icon {
  color: var(--text-primary);
  margin-bottom: 10px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.empty-icon-box {
  width: 46px;
  height: 46px;
  margin-bottom: 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.empty-state p {
  font-size: 0.82rem;
  color: var(--text-muted);
  max-width: 320px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

@media (max-width: 600px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

@media (max-width: 400px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>

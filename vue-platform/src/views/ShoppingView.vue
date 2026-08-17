<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useShoppingStore } from '@/stores/shopping';
import { useFridgeStore } from '@/stores/fridge';
import ShoppingItemRow from '@/components/shopping/ShoppingItemRow.vue';
import AddShoppingItemModal from '@/components/shopping/AddShoppingItemModal.vue';
import { ShoppingCart, Plus, CheckCheck, Package } from '@lucide/vue';

const shoppingStore = useShoppingStore();
const fridgeStore = useFridgeStore();

const quickName = ref('');
const showAddModal = ref(false);
const isAdding = ref(false);

onMounted(async () => {
  await fridgeStore.fetchFridges();
  await shoppingStore.fetchShoppingItems();
});

const handleQuickAdd = async () => {
  if (!quickName.value.trim()) return;
  isAdding.value = true;
  await shoppingStore.addItem({ name: quickName.value.trim() });
  quickName.value = '';
  isAdding.value = false;
};
</script>

<template>
  <div class="shopping-page fade-in">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h2 class="section-heading">Список покупок</h2>
        <p class="section-subheading">
          Залишилось купити: <strong>{{ shoppingStore.uncheckedItems.length }}</strong> шт.
        </p>
      </div>

      <div class="header-actions">
        <button class="btn-primary btn-sm" @click="showAddModal = true">
          <Plus :size="16" />
          <span>Додати товар</span>
        </button>
      </div>
    </header>

    <!-- Quick Add Input -->
    <div class="quick-add-bar nordic-card">
      <form @submit.prevent="handleQuickAdd" class="quick-form">
        <ShoppingCart :size="16" class="input-icon" />
        <input
          v-model="quickName"
          type="text"
          class="quick-input"
          placeholder="Швидке додавання до списку (напр. Молоко, Хліб, Яйця)..."
          :disabled="isAdding"
        />
        <button type="submit" class="btn-primary btn-sm" :disabled="!quickName.trim() || isAdding">
          <Plus :size="15" />
          <span>Додати</span>
        </button>
      </form>
    </div>

    <!-- Loading State -->
    <div v-if="shoppingStore.loading" class="loading-state nordic-card">
      <Package class="spin-icon" :size="28" />
      <p>Завантаження списку покупок...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="shoppingStore.items.length === 0" class="empty-state nordic-card">
      <div class="empty-icon-box">
        <ShoppingCart :size="24" />
      </div>
      <h3>Ваш список покупок порожній</h3>
      <p>Додайте необхідні товари. Куплені продукти можна перемістити в холодильник в 1 клік.</p>
    </div>

    <!-- List -->
    <div v-else class="shopping-sections">
      <section v-if="shoppingStore.uncheckedItems.length > 0" class="section">
        <h3 class="section-title">
          <ShoppingCart :size="15" />
          <span>Купити ({{ shoppingStore.uncheckedItems.length }})</span>
        </h3>
        <div class="items-list">
          <ShoppingItemRow v-for="item in shoppingStore.uncheckedItems" :key="item.id" :item="item" />
        </div>
      </section>

      <section v-if="shoppingStore.checkedItems.length > 0" class="section">
        <h3 class="section-title checked-title">
          <CheckCheck :size="15" />
          <span>Куплено / Готово ({{ shoppingStore.checkedItems.length }})</span>
        </h3>
        <div class="items-list">
          <ShoppingItemRow v-for="item in shoppingStore.checkedItems" :key="item.id" :item="item" />
        </div>
      </section>
    </div>

    <AddShoppingItemModal v-if="showAddModal" @close="showAddModal = false" />
  </div>
</template>

<style scoped>
.shopping-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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

.btn-sm {
  padding: 7px 12px;
  font-size: 0.82rem;
}

.quick-add-bar {
  padding: 8px 12px;
}

.quick-form {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.quick-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.88rem;
}

.quick-input::placeholder {
  color: var(--text-muted);
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

.shopping-sections {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-weight: 600;
}

.checked-title {
  color: var(--text-muted);
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>

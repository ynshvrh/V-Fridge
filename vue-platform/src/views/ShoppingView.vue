<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useShoppingStore } from '@/stores/shopping';
import { useFridgeStore } from '@/stores/fridge';
import FridgeSelector from '@/components/fridge/FridgeSelector.vue';
import ShoppingItemRow from '@/components/shopping/ShoppingItemRow.vue';
import AddShoppingItemModal from '@/components/shopping/AddShoppingItemModal.vue';
import CreateFridgeModal from '@/components/fridge/CreateFridgeModal.vue';
import { ShoppingCart, Plus, CheckCheck, Package } from '@lucide/vue';

const shoppingStore = useShoppingStore();
const fridgeStore = useFridgeStore();

const quickName = ref('');
const showAddModal = ref(false);
const showCreateFridgeModal = ref(false);
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
    <header class="page-header">
      <div class="header-left">
        <FridgeSelector @open-create-modal="showCreateFridgeModal = true" />
      </div>

      <div class="header-right">
        <button class="btn-primary" @click="showAddModal = true">
          <Plus :size="18" />
          <span>Додати елемент</span>
        </button>
      </div>
    </header>

    <div class="quick-add-bar glass-card">
      <form @submit.prevent="handleQuickAdd" class="quick-form">
        <ShoppingCart :size="18" class="input-icon" />
        <input
          v-model="quickName"
          type="text"
          class="quick-input"
          placeholder="Швидке додавання до списку покупок (напр. Молоко, Хліб)..."
          :disabled="isAdding"
        />
        <button type="submit" class="btn-primary btn-sm" :disabled="!quickName.trim() || isAdding">
          <Plus :size="16" />
          <span>Додати</span>
        </button>
      </form>
    </div>

    <div v-if="shoppingStore.loading" class="loading-state glass-card">
      <Package class="spin-icon" :size="32" />
      <p>Завантаження списку покупок...</p>
    </div>

    <div v-else-if="shoppingStore.items.length === 0" class="empty-state glass-card">
      <div class="empty-icon-bg">
        <ShoppingCart :size="36" />
      </div>
      <h3>Ваш список покупок порожній</h3>
      <p>Додайте необхідні продукти. Куплені товари можна одразу перемістити в холодильник.</p>
    </div>

    <div v-else class="shopping-sections">
      <section v-if="shoppingStore.uncheckedItems.length > 0" class="section">
        <h3 class="section-title">
          <ShoppingCart :size="16" />
          <span>Купити ({{ shoppingStore.uncheckedItems.length }})</span>
        </h3>
        <div class="items-list">
          <ShoppingItemRow v-for="item in shoppingStore.uncheckedItems" :key="item.id" :item="item" />
        </div>
      </section>

      <section v-if="shoppingStore.checkedItems.length > 0" class="section">
        <h3 class="section-title checked-title">
          <CheckCheck :size="16" />
          <span>Куплено / Готово ({{ shoppingStore.checkedItems.length }})</span>
        </h3>
        <div class="items-list">
          <ShoppingItemRow v-for="item in shoppingStore.checkedItems" :key="item.id" :item="item" />
        </div>
      </section>
    </div>

    <AddShoppingItemModal v-if="showAddModal" @close="showAddModal = false" />
    <CreateFridgeModal v-if="showCreateFridgeModal" @close="showCreateFridgeModal = false" />
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.quick-add-bar {
  padding: 8px 14px;
  margin-bottom: 20px;
}

.quick-form {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-icon {
  color: var(--accent-orange);
}

.quick-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.92rem;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.82rem;
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

.shopping-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: 10px;
  font-weight: 600;
}

.checked-title {
  color: var(--text-muted);
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>

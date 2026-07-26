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
          <span>Add Item</span>
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
          placeholder="Quick add to shopping list (e.g. Milk, Eggs, Bread)..."
          :disabled="isAdding"
        />
        <button type="submit" class="btn-primary btn-sm" :disabled="!quickName.trim() || isAdding">
          <Plus :size="16" />
          <span>Add</span>
        </button>
      </form>
    </div>

    <div v-if="shoppingStore.loading" class="loading-state glass-card">
      <Package class="spin-icon" :size="32" />
      <p>Loading shopping list...</p>
    </div>

    <div v-else-if="shoppingStore.items.length === 0" class="empty-state glass-card">
      <div class="empty-icon-bg">
        <ShoppingCart :size="36" />
      </div>
      <h3>Your shopping list is empty</h3>
      <p>Add groceries you need to buy. Items can be moved directly into your fridge upon purchase.</p>
    </div>

    <div v-else class="shopping-sections">
      <section v-if="shoppingStore.uncheckedItems.length > 0" class="section">
        <h3 class="section-title">
          <ShoppingCart :size="16" />
          <span>To Buy ({{ shoppingStore.uncheckedItems.length }})</span>
        </h3>
        <div class="items-list">
          <ShoppingItemRow v-for="item in shoppingStore.uncheckedItems" :key="item.id" :item="item" />
        </div>
      </section>

      <section v-if="shoppingStore.checkedItems.length > 0" class="section">
        <h3 class="section-title checked-title">
          <CheckCheck :size="16" />
          <span>Checked / Done ({{ shoppingStore.checkedItems.length }})</span>
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
  margin-bottom: 20px;
}

.quick-add-bar {
  padding: 10px 16px;
  margin-bottom: 24px;
}

.quick-form {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-icon {
  color: var(--text-muted);
}

.quick-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 0.85rem;
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

.shopping-sections {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
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

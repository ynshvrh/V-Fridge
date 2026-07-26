<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/client';
import { Refrigerator, Plus, AlertTriangle } from '@lucide/vue';

interface Product {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  category: string;
  ownerId: number;
  createdAt: string;
}

const products = ref<Product[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    products.value = await api.fetch<Product[]>('/products');
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="dashboard-page fade-in">
    <header class="page-header">
      <div>
        <h1>Inventory</h1>
        <p class="subtitle">Products currently in your active fridge</p>
      </div>
      <button class="btn-primary">
        <Plus :size="18" />
        <span>Add Product</span>
      </button>
    </header>

    <div v-if="loading" class="loading-state glass-card">
      <p>Loading inventory...</p>
    </div>

    <div v-else-if="products.length === 0" class="empty-state glass-card">
      <div class="empty-icon-bg">
        <Refrigerator :size="36" />
      </div>
      <h3>Your fridge is empty</h3>
      <p>Start tracking by adding your first product to the inventory.</p>
    </div>

    <div v-else class="products-grid">
      <div v-for="item in products" :key="item.id" class="glass-card product-card">
        <div class="card-top">
          <span class="category-badge">{{ item.category }}</span>
          <span v-if="item.expiryDate" class="expiry-tag">
            <AlertTriangle :size="12" />
            {{ item.expiryDate }}
          </span>
        </div>
        <h3 class="product-title">{{ item.name }}</h3>
        <p class="product-qty">{{ item.quantity }} {{ item.unit }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 4px;
}

.loading-state, .empty-state {
  padding: 48px;
  text-align: center;
  color: var(--text-secondary);
}

.empty-icon-bg {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: rgba(140, 83, 131, 0.15);
  color: var(--accent-purple-hover);
  display: flex;
  align-items: center;
  justify-content: center;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.product-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category-badge {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
}

.expiry-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--accent-amber);
}

.product-title {
  font-size: 1.1rem;
}

.product-qty {
  color: var(--text-secondary);
  font-size: 0.9rem;
}
</style>

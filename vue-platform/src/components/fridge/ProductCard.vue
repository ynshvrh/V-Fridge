<script setup lang="ts">
import { computed } from 'vue';
import { type Product, useProductStore } from '@/stores/product';
import { Plus, Minus, Trash2, Clock, AlertTriangle } from '@lucide/vue';

const props = defineProps<{
  product: Product;
}>();

const productStore = useProductStore();

const status = computed(() => {
  if (!props.product.expiryDate) return { label: 'Fresh', class: 'status-fresh' };
  const expiry = new Date(props.product.expiryDate);
  const today = new Date();
  today.setHours(0,0,0,0);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

  if (diffDays < 0) return { label: 'Expired', class: 'status-expired' };
  if (diffDays <= 2) return { label: 'Expiring Soon', class: 'status-warning' };
  return { label: 'Fresh', class: 'status-fresh' };
});

const increaseQuantity = async () => {
  await productStore.updateProduct(props.product.id, {
    quantity: Number((props.product.quantity + 1).toFixed(2))
  });
};

const decreaseQuantity = async () => {
  const newQty = Number((props.product.quantity - 1).toFixed(2));
  if (newQty <= 0) {
    await productStore.deleteProduct(props.product.id);
  } else {
    await productStore.updateProduct(props.product.id, { quantity: newQty });
  }
};

const handleDelete = async () => {
  await productStore.deleteProduct(props.product.id);
};
</script>

<template>
  <div class="glass-card product-card fade-in">
    <div class="card-header">
      <span class="category-chip">{{ product.category }}</span>
      <div class="status-badge" :class="status.class">
        <AlertTriangle v-if="status.class !== 'status-fresh'" :size="12" />
        <Clock v-else :size="12" />
        <span>{{ status.label }}</span>
      </div>
    </div>

    <div class="card-body">
      <h3 class="product-name">{{ product.name }}</h3>
      <p v-if="product.description" class="product-desc">{{ product.description }}</p>
      <p v-if="product.expiryDate" class="expiry-date">Expires: {{ product.expiryDate }}</p>
    </div>

    <div class="card-footer">
      <div class="quantity-controls">
        <button class="qty-btn" title="Decrease / Consume" @click="decreaseQuantity">
          <Minus :size="14" />
        </button>
        <span class="qty-val">{{ product.quantity }} <small>{{ product.unit }}</small></span>
        <button class="qty-btn" title="Increase" @click="increaseQuantity">
          <Plus :size="14" />
        </button>
      </div>

      <button class="delete-btn" title="Delete Product" @click="handleDelete">
        <Trash2 :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category-chip {
  font-size: 0.72rem;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
}

.status-fresh {
  background: rgba(16, 185, 129, 0.12);
  color: var(--accent-emerald);
}

.status-warning {
  background: rgba(245, 158, 11, 0.12);
  color: var(--accent-amber);
}

.status-expired {
  background: rgba(244, 63, 94, 0.12);
  color: var(--accent-rose);
}

.product-name {
  font-size: 1.1rem;
  color: var(--text-primary);
}

.product-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.expiry-date {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 6px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 14, 23, 0.5);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.qty-btn {
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  transition: var(--transition-fast);
}

.qty-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.qty-val {
  font-weight: 600;
  font-size: 0.95rem;
}

.qty-val small {
  font-weight: 400;
  color: var(--text-muted);
}

.delete-btn {
  color: var(--text-muted);
  padding: 6px;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.delete-btn:hover {
  color: var(--accent-rose);
  background: rgba(244, 63, 94, 0.1);
}
</style>

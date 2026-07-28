<script setup lang="ts">
import { computed } from 'vue';
import { type Product, useProductStore } from '@/stores/product';
import { Plus, Minus, Trash2, Clock, AlertTriangle } from '@lucide/vue';

const props = defineProps<{
  product: Product;
}>();

const productStore = useProductStore();

const status = computed(() => {
  if (!props.product.expiryDate) return { label: 'Fresh', badgeClass: 'badge-fresh', isAlert: false };
  const expiry = new Date(props.product.expiryDate);
  const today = new Date();
  today.setHours(0,0,0,0);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

  if (diffDays < 0) return { label: 'Expired', badgeClass: 'badge-expired', isAlert: true };
  if (diffDays <= 2) return { label: 'Expiring Soon', badgeClass: 'badge-warning', isAlert: true };
  return { label: 'Fresh', badgeClass: 'badge-fresh', isAlert: false };
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
    <!-- Single line header with Category & Status Badge -->
    <div class="card-header">
      <span class="category-chip">{{ product.category }}</span>
      <div class="badge" :class="status.badgeClass">
        <AlertTriangle v-if="status.isAlert" :size="11" />
        <Clock v-else :size="11" />
        <span>{{ status.label }}</span>
      </div>
    </div>

    <!-- Product details -->
    <div class="card-body">
      <h3 class="product-name">{{ product.name }}</h3>
      <p v-if="product.description" class="product-desc">{{ product.description }}</p>
      <p v-if="product.expiryDate" class="expiry-date">Expires: {{ product.expiryDate }}</p>
    </div>

    <!-- Quantity & Action controls -->
    <div class="card-footer">
      <div class="quantity-controls">
        <button class="qty-btn" title="Decrease / Consume" @click="decreaseQuantity">
          <Minus :size="13" />
        </button>
        <span class="qty-val">{{ product.quantity }} <small>{{ product.unit }}</small></span>
        <button class="qty-btn" title="Increase" @click="increaseQuantity">
          <Plus :size="13" />
        </button>
      </div>

      <button class="delete-btn" title="Delete Product" @click="handleDelete">
        <Trash2 :size="15" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.category-chip {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--border-subtle);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.product-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.expiry-date {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-primary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.qty-btn {
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  transition: var(--transition-fast);
}

.qty-btn:hover {
  background: var(--accent-orange-bg);
  color: var(--accent-orange);
}

.qty-val {
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--text-primary);
}

.qty-val small {
  font-weight: 400;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.delete-btn {
  color: var(--text-muted);
  padding: 5px;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.delete-btn:hover {
  color: var(--status-expired);
  background: var(--status-expired-bg);
}
</style>

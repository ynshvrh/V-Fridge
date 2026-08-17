<script setup lang="ts">
import { ref } from 'vue';
import { type MealPlanGapItem, usePlannerStore } from '@/stores/planner';
import { ShoppingCart, Plus, CheckCircle2 } from '@lucide/vue';

const props = defineProps<{
  gaps: MealPlanGapItem[];
}>();

const plannerStore = usePlannerStore();
const isImporting = ref(false);
const importMessage = ref<string | null>(null);

const handleImportGaps = async () => {
  if (props.gaps.length === 0) return;
  isImporting.value = true;
  importMessage.value = null;
  const res = await plannerStore.importGaps(props.gaps);
  isImporting.value = false;
  if (res) {
    importMessage.value = `Added ${res.created} missing item(s) to shopping list (${res.skipped} already in list/fridge).`;
  }
};
</script>

<template>
  <div class="glass-card gap-card fade-in">
    <div class="gap-header">
      <div class="header-title">
        <ShoppingCart :size="20" class="header-icon" />
        <h3>Missing Ingredients ({{ gaps.length }})</h3>
      </div>
      <button
        v-if="gaps.length > 0"
        class="btn-primary btn-sm"
        :disabled="isImporting"
        @click="handleImportGaps"
      >
        <Plus :size="16" />
        <span>{{ isImporting ? 'Adding...' : 'Add All to Shopping List' }}</span>
      </button>
    </div>

    <div v-if="importMessage" class="success-banner">
      <CheckCircle2 :size="16" />
      <span>{{ importMessage }}</span>
    </div>

    <div v-if="gaps.length === 0" class="empty-gaps">
      <span>You have all necessary ingredients in your fridge!</span>
    </div>

    <div v-else class="gaps-grid">
      <div v-for="(item, idx) in gaps" :key="idx" class="gap-item-chip">
        <span class="gap-name">{{ item.name }}</span>
        <span v-if="item.quantity" class="gap-qty">{{ item.quantity }} {{ item.unit || '' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gap-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  color: var(--accent-amber);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85rem;
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: var(--accent-emerald);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
}

.empty-gaps {
  color: var(--accent-emerald);
  font-size: 0.9rem;
}

.gaps-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gap-item-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
}

.gap-name {
  color: var(--text-primary);
  font-weight: 500;
}

.gap-qty {
  color: var(--accent-amber);
  font-size: 0.78rem;
}
</style>

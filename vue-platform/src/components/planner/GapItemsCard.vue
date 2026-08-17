<script setup lang="ts">
import { ref } from 'vue';
import { type MealPlanGapItem, usePlannerStore } from '@/stores/planner';
import { useI18n } from '@/i18n';
import { ShoppingCart, Plus, CheckCircle2 } from '@lucide/vue';

const props = defineProps<{
  gaps: MealPlanGapItem[];
}>();

const plannerStore = usePlannerStore();
const { t } = useI18n();

const isImporting = ref(false);
const importMessage = ref<string | null>(null);

const handleImportGaps = async () => {
  if (props.gaps.length === 0) return;
  isImporting.value = true;
  importMessage.value = null;
  const res = await plannerStore.importGaps(props.gaps);
  isImporting.value = false;
  if (res) {
    importMessage.value = `${t('plannerGapsAdded') || 'Додано до списку покупок'}: ${res.created} (${res.skipped} ${t('plannerGapsSkipped') || 'вже є'})`;
  }
};
</script>

<template>
  <div class="nordic-card gap-card fade-in">
    <div class="gap-header">
      <div class="header-title">
        <ShoppingCart :size="18" class="header-icon" />
        <h3>{{ t('plannerMissingIngredients') || 'Відсутні інгредієнти для плану' }} ({{ gaps.length }})</h3>
      </div>
      <button
        v-if="gaps.length > 0"
        class="btn-primary btn-sm"
        :disabled="isImporting"
        @click="handleImportGaps"
      >
        <Plus :size="15" />
        <span>{{ isImporting ? (t('actionAdding') || 'Додавання...') : (t('plannerAddAllGaps') || 'Додати всі в покупки') }}</span>
      </button>
    </div>

    <div v-if="importMessage" class="success-banner">
      <CheckCircle2 :size="15" />
      <span>{{ importMessage }}</span>
    </div>

    <div v-if="gaps.length === 0" class="empty-gaps">
      <span>{{ t('plannerAllIngredientsAvailable') || 'Усі необхідні інгредієнти є у вашому холодильнику!' }}</span>
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
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-icon {
  color: var(--text-muted);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.8rem;
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--status-fresh-bg);
  border: 1px solid var(--status-fresh-border);
  color: var(--status-fresh);
  padding: 8px 12px;
  border-radius: var(--radius-xs);
  font-size: 0.82rem;
}

.empty-gaps {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.gaps-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.gap-item-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  font-size: 0.78rem;
}

.gap-name {
  color: var(--text-primary);
  font-weight: 500;
}

.gap-qty {
  color: var(--text-muted);
  font-size: 0.72rem;
}
</style>

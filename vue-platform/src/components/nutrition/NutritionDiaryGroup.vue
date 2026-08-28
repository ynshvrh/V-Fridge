<script setup lang="ts">
import type { NutritionLog } from '@/stores/nutrition';
import { Coffee, Soup, Salad, Cookie, Edit2, Trash2 } from '@lucide/vue';

defineProps<{
  mealType: string;
  items: NutritionLog[];
}>();

const emit = defineEmits<{
  (e: 'edit', log: NutritionLog): void;
  (e: 'delete', id: number): void;
}>();

const getMealLabel = (type: string) => {
  switch (type) {
    case 'breakfast': return 'Сніданок';
    case 'lunch': return 'Обід';
    case 'dinner': return 'Вечеря';
    case 'snack': return 'Перекус';
    default: return type;
  }
};
</script>

<template>
  <div class="meal-group">
    <div class="meal-header">
      <div class="meal-title">
        <Coffee v-if="mealType === 'breakfast'" :size="18" class="meal-icon" />
        <Soup v-else-if="mealType === 'lunch'" :size="18" class="meal-icon" />
        <Salad v-else-if="mealType === 'dinner'" :size="18" class="meal-icon" />
        <Cookie v-else :size="18" class="meal-icon" />
        <span>{{ getMealLabel(mealType) }}</span>
      </div>
      <span v-if="items.length > 0" class="meal-calories">
        {{ items.reduce((acc, i) => acc + i.calories, 0) }} кКал
      </span>
    </div>

    <div v-if="items.length === 0" class="empty-meal-hint">
      Записів немає
    </div>

    <div v-else class="logs-card card">
      <div v-for="log in items" :key="log.id" class="log-item">
        <div class="log-info">
          <div class="log-name">{{ log.foodName }}</div>
          <div class="log-details">
            {{ log.quantity }} {{ log.unit ?? 'порція' }} · Б: {{ Math.round(log.protein) }}г · Ж: {{ Math.round(log.fat) }}г · В: {{ Math.round(log.carbs) }}г
          </div>
        </div>

        <div class="log-right">
          <span class="log-kcal">{{ log.calories }} кКал</span>
          <div class="log-actions">
            <button class="action-btn" title="Редагувати" @click="emit('edit', log)">
              <Edit2 :size="16" />
            </button>
            <button class="action-btn danger" title="Вилучити" @click="emit('delete', log.id)">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.meal-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
}

.meal-icon {
  color: var(--primary);
}

.meal-calories {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}

.empty-meal-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  padding: 8px 12px;
  background: var(--bg-surface);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-sm);
}

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

.logs-card {
  padding: 0;
  overflow: hidden;
}

.log-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.log-item:last-child {
  border-bottom: none;
}

.log-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.log-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.log-details {
  font-size: 0.74rem;
  color: var(--text-muted);
}

.log-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.log-kcal {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
}

.log-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 4px;
  cursor: pointer;
  border-radius: var(--radius-xs);
  transition: var(--transition-fast);
}

.action-btn:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.action-btn.danger:hover {
  color: var(--status-expired);
}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import type { NutritionSummary, NutritionTargets } from '@/stores/nutrition';
import { Flame } from '@lucide/vue';

const props = defineProps<{
  summary: NutritionSummary;
  targets: NutritionTargets;
}>();

const calPercent = computed(() => {
  if (!props.targets.calories) return 0;
  return Math.min(100, Math.round((props.summary.calories / props.targets.calories) * 100));
});

const protPercent = computed(() => {
  if (!props.targets.protein) return 0;
  return Math.min(100, Math.round((props.summary.protein / Number(props.targets.protein)) * 100));
});

const fatPercent = computed(() => {
  if (!props.targets.fat) return 0;
  return Math.min(100, Math.round((props.summary.fat / Number(props.targets.fat)) * 100));
});

const carbsPercent = computed(() => {
  if (!props.targets.carbs) return 0;
  return Math.min(100, Math.round((props.summary.carbs / Number(props.targets.carbs)) * 100));
});
</script>

<template>
  <div class="dashboard-grid">
    <!-- Calories Main Ring Card -->
    <div class="calories-card card">
      <div class="calories-info">
        <div class="card-tag">
          <Flame :size="16" class="orange-icon" />
          <span>Калорії</span>
        </div>
        <div class="calories-num">
          {{ summary.calories }}
          <span class="unit-text">кКал</span>
        </div>
        <p class="goal-text">
          <template v-if="targets.calories">Ціль: {{ targets.calories }} кКал</template>
          <template v-else>Ціль не встановлено</template>
        </p>
      </div>

      <div class="ring-wrapper">
        <svg class="progress-ring" viewBox="0 0 36 36">
          <path
            class="ring-bg"
            stroke-width="3.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            class="ring-progress"
            stroke-width="3.5"
            :stroke-dasharray="`${calPercent}, 100`"
            stroke-linecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div class="ring-label">{{ calPercent }}%</div>
      </div>
    </div>

    <!-- Macros Mini Grid -->
    <div class="macros-grid">
      <!-- Protein -->
      <div class="macro-card card protein-card">
        <div class="macro-title">Білки</div>
        <div class="macro-val">
          {{ Math.round(summary.protein) }}<span class="macro-unit">г</span>
        </div>
        <div class="macro-goal">Ціль: {{ targets.protein ?? '—' }}г</div>
        <div class="macro-bar-bg">
          <div class="macro-bar-fill protein-fill" :style="{ width: `${protPercent}%` }" />
        </div>
      </div>

      <!-- Fat -->
      <div class="macro-card card fat-card">
        <div class="macro-title">Жири</div>
        <div class="macro-val">
          {{ Math.round(summary.fat) }}<span class="macro-unit">г</span>
        </div>
        <div class="macro-goal">Ціль: {{ targets.fat ?? '—' }}г</div>
        <div class="macro-bar-bg">
          <div class="macro-bar-fill fat-fill" :style="{ width: `${fatPercent}%` }" />
        </div>
      </div>

      <!-- Carbs -->
      <div class="macro-card card carbs-card">
        <div class="macro-title">Вуглеводи</div>
        <div class="macro-val">
          {{ Math.round(summary.carbs) }}<span class="macro-unit">г</span>
        </div>
        <div class="macro-goal">Ціль: {{ targets.carbs ?? '—' }}г</div>
        <div class="macro-bar-bg">
          <div class="macro-bar-fill carbs-fill" :style="{ width: `${carbsPercent}%` }" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--shadow-card);
}

.calories-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
}

.orange-icon {
  color: var(--primary);
}

.calories-num {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
  margin-top: 4px;
}

.unit-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-left: 4px;
}

.goal-text {
  font-size: 0.76rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.ring-wrapper {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}

.progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  color: var(--border-subtle);
}

.ring-progress {
  color: var(--primary);
  transition: stroke-dasharray 0.4s ease;
}

.ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.macros-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.macro-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px;
}

.macro-title {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.protein-card .macro-title { color: #10B981; }
.fat-card .macro-title { color: #F59E0B; }
.carbs-card .macro-title { color: #0284C7; }

.macro-val {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 4px 0 2px 0;
}

.macro-unit {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-left: 2px;
}

.macro-goal {
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.macro-bar-bg {
  width: 100%;
  height: 4px;
  border-radius: 4px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.macro-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.protein-fill { background: #10B981; }
.fat-fill { background: #F59E0B; }
.carbs-fill { background: #0284C7; }
</style>

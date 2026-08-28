<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useNutritionStore, type NutritionLog } from '@/stores/nutrition';
import { useProductStore } from '@/stores/product';
import { useFridgeStore } from '@/stores/fridge';
import NutritionSummaryCard from '@/components/nutrition/NutritionSummaryCard.vue';
import NutritionDiaryGroup from '@/components/nutrition/NutritionDiaryGroup.vue';
import LogFoodModal from '@/components/nutrition/LogFoodModal.vue';
import NutritionTargetsModal from '@/components/nutrition/NutritionTargetsModal.vue';
import { 
  Plus, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Loader2 
} from '@lucide/vue';

const nutritionStore = useNutritionStore();
const productStore = useProductStore();
const fridgeStore = useFridgeStore();

const selectedDate = ref(new Date().toISOString().split('T')[0]);
const isLogModalOpen = ref(false);
const isTargetsModalOpen = ref(false);
const editingLog = ref<NutritionLog | null>(null);

onMounted(async () => {
  await fridgeStore.fetchFridges();
  await nutritionStore.fetchDailyData(selectedDate.value);
  await productStore.fetchProducts();
});

watch(selectedDate, async (newDate) => {
  await nutritionStore.fetchDailyData(newDate);
});

watch(() => fridgeStore.activeFridgeId, async () => {
  nutritionStore.invalidateCache();
  await Promise.all([
    nutritionStore.fetchDailyData(selectedDate.value, true),
    productStore.fetchProducts(true)
  ]);
});

const isToday = computed(() => selectedDate.value === new Date().toISOString().split('T')[0]);

const handlePrevDay = () => {
  const d = new Date(selectedDate.value);
  d.setDate(d.getDate() - 1);
  selectedDate.value = d.toISOString().split('T')[0];
};

const handleNextDay = () => {
  const d = new Date(selectedDate.value);
  d.setDate(d.getDate() + 1);
  selectedDate.value = d.toISOString().split('T')[0];
};

const summary = computed(() => nutritionStore.currentData?.summary ?? { calories: 0, protein: 0, fat: 0, carbs: 0 });
const targets = computed(() => nutritionStore.currentData?.targets ?? { calories: null, protein: null, fat: null, carbs: null });

const mealsOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
const groupedLogs = computed(() => {
  const logs = nutritionStore.currentData?.logs ?? [];
  return mealsOrder.map((mType) => ({
    type: mType,
    items: logs.filter((l) => l.mealType === mType)
  }));
});

const openAddModal = () => {
  editingLog.value = null;
  isLogModalOpen.value = true;
};

const openEditModal = (log: NutritionLog) => {
  editingLog.value = log;
  isLogModalOpen.value = true;
};

const handleLogSubmit = async (payload: any) => {
  if (editingLog.value) {
    await nutritionStore.updateLog(editingLog.value.id, selectedDate.value, {
      mealType: payload.mealType,
      foodName: payload.foodName,
      quantity: payload.quantity,
      unit: payload.unit,
      calories: payload.calories,
      protein: payload.protein,
      fat: payload.fat,
      carbs: payload.carbs
    });
  } else {
    await nutritionStore.logFood({
      ...payload,
      date: selectedDate.value
    });
    if (payload.productId) {
      await productStore.fetchProducts();
    }
  }
  isLogModalOpen.value = false;
};

const handleDeleteLog = async (id: number) => {
  if (!confirm('Вилучити цей запис прийому їжі?')) return;
  await nutritionStore.deleteLog(id, selectedDate.value);
};

const handleTargetsSubmit = async (newTargets: any) => {
  await nutritionStore.setTargets(newTargets, selectedDate.value);
  isTargetsModalOpen.value = false;
};
</script>

<template>
  <div class="nutrition-page fade-in">
    <!-- Header -->
    <header class="page-header">
      <div class="header-titles">
        <h2 class="section-heading">Трекер калорій</h2>
        <p class="section-subheading">Щоденник харчування та контроль БЖУ</p>
      </div>

      <div class="header-actions">
        <button class="btn-secondary btn-sm" title="Налаштувати цілі" @click="isTargetsModalOpen = true">
          <Settings :size="15" />
          <span>Цілі</span>
        </button>
        <button class="btn-primary btn-sm" @click="openAddModal">
          <Plus :size="16" />
          <span>Додати їжу</span>
        </button>
      </div>
    </header>

    <!-- Date Navigation Bar -->
    <div class="date-bar">
      <button class="date-nav-btn" @click="handlePrevDay">
        <ChevronLeft :size="18" />
      </button>
      <div class="date-display">
        <Calendar :size="16" class="date-icon" />
        <span>{{ isToday ? 'Сьогодні (' + selectedDate + ')' : selectedDate }}</span>
      </div>
      <button class="date-nav-btn" @click="handleNextDay">
        <ChevronRight :size="18" />
      </button>
    </div>

    <!-- Main Dashboard Grid -->
    <div v-if="nutritionStore.loading && !nutritionStore.currentData" class="loading-state">
      <Loader2 :size="32" class="animate-spin" />
    </div>

    <div v-else class="content-body">
      <!-- Calories and Macros Summary Card -->
      <NutritionSummaryCard
        :summary="summary"
        :targets="targets"
      />

      <!-- Food Diary Groups -->
      <section class="diary-section">
        <h3 class="section-title">Прийоми їжі</h3>

        <div class="meals-list">
          <NutritionDiaryGroup
            v-for="group in groupedLogs"
            :key="group.type"
            :meal-type="group.type"
            :items="group.items"
            @edit="openEditModal"
            @delete="handleDeleteLog"
          />
        </div>
      </section>
    </div>

    <!-- Modals -->
    <LogFoodModal
      v-if="isLogModalOpen"
      :editing-log="editingLog"
      @close="isLogModalOpen = false"
      @submit="handleLogSubmit"
    />

    <NutritionTargetsModal
      v-if="isTargetsModalOpen"
      :targets="targets"
      @close="isTargetsModalOpen = false"
      @submit="handleTargetsSubmit"
    />
  </div>
</template>

<style scoped>
.nutrition-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-sm {
  padding: 7px 12px;
  font-size: 0.82rem;
}

.date-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 320px;
  margin: 0 auto;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  width: 100%;
}

.date-nav-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: var(--transition-fast);
  background: transparent;
  border: none;
  cursor: pointer;
}

.date-nav-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.date-display {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 0.82rem;
  color: var(--text-primary);
}

.date-icon {
  color: var(--primary);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px;
  color: var(--primary);
}

.content-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.diary-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.meals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

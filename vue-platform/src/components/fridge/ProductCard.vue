<script setup lang="ts">
import { computed, ref } from 'vue';
import { type Product, useProductStore } from '@/stores/product';
import { Plus, Minus, Trash2, Clock, AlertTriangle, Utensils, X, Check } from '@lucide/vue';

const props = defineProps<{
  product: Product;
}>();

const productStore = useProductStore();

const status = computed(() => {
  if (!props.product.expiryDate) return { label: 'Свіжий', badgeClass: 'badge-fresh', isAlert: false };
  const expiry = new Date(props.product.expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));

  if (diffDays < 0) return { label: 'Прострочено', badgeClass: 'badge-expired', isAlert: true };
  if (diffDays <= 2) return { label: 'Спливає', badgeClass: 'badge-warning', isAlert: true };
  return { label: 'Свіжий', badgeClass: 'badge-fresh', isAlert: false };
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

const isPreparedMeal = computed(() => {
  return props.product.category === 'prepared-meals' ||
    props.product.unit.toLowerCase().includes('порц') ||
    (props.product.description && props.product.description.includes('КБЖВ'));
});

// Eat Portion Modal State
const showEatModal = ref(false);
const selectedPortions = ref(1);
const selectedMealType = ref<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
const isEating = ref(false);
const eatSuccess = ref(false);

const getInitialMealType = (): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 21) return 'dinner';
  return 'snack';
};

const openEatModal = () => {
  selectedPortions.value = Math.min(1, props.product.quantity);
  selectedMealType.value = getInitialMealType();
  showEatModal.value = true;
};

// Parse single portion macros from description
const parsedMacros = computed(() => {
  const desc = props.product.description || '';
  let calories = 0, protein = 0, fat = 0, carbs = 0;
  const calMatch = desc.match(/(\d+)\s*(?:кКал|kcal)/i);
  if (calMatch) calories = parseInt(calMatch[1], 10);
  const protMatch = desc.match(/Б:\s*([\d\.,]+)/i);
  if (protMatch) protein = parseFloat(protMatch[1].replace(',', '.'));
  const fatMatch = desc.match(/Ж:\s*([\d\.,]+)/i);
  if (fatMatch) fat = parseFloat(fatMatch[1].replace(',', '.'));
  const carbsMatch = desc.match(/В:\s*([\d\.,]+)/i);
  if (carbsMatch) carbs = parseFloat(carbsMatch[1].replace(',', '.'));

  return {
    calories: Math.round(calories * selectedPortions.value),
    protein: Number((protein * selectedPortions.value).toFixed(1)),
    fat: Number((fat * selectedPortions.value).toFixed(1)),
    carbs: Number((carbs * selectedPortions.value).toFixed(1)),
    hasMacros: calories > 0 || protein > 0
  };
});

const handleConfirmEat = async () => {
  isEating.value = true;
  try {
    const res = await productStore.consumeProduct(props.product.id, {
      portions: selectedPortions.value,
      mealType: selectedMealType.value
    });
    if (res) {
      eatSuccess.value = true;
      setTimeout(() => {
        eatSuccess.value = false;
        showEatModal.value = false;
      }, 1200);
    }
  } finally {
    isEating.value = false;
  }
};

const handleDelete = async () => {
  await productStore.deleteProduct(props.product.id);
};
</script>

<template>
  <div class="nordic-card product-card fade-in">
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
      <p v-if="product.expiryDate" class="expiry-date">Термін: {{ product.expiryDate }}</p>
    </div>

    <!-- Prepared Meal Quick Eat Action Strip -->
    <div v-if="isPreparedMeal" class="prepared-meal-action-row">
      <button
        class="eat-portion-btn"
        title="З'їсти порцію та внести КБЖВ у щоденник"
        @click="openEatModal"
      >
        <Utensils :size="13" />
        <span>З'їсти порцію</span>
      </button>
    </div>

    <!-- Quantity & Action controls -->
    <div class="card-footer">
      <div class="quantity-controls">
        <button class="qty-btn" title="Зменшити / Спожити" @click="decreaseQuantity">
          <Minus :size="13" />
        </button>
        <span class="qty-val">{{ product.quantity }} <small>{{ product.unit }}</small></span>
        <button class="qty-btn" title="Збільшити" @click="increaseQuantity">
          <Plus :size="13" />
        </button>
      </div>

      <button class="delete-btn" title="Видалити продукт" @click="handleDelete">
        <Trash2 :size="15" />
      </button>
    </div>

    <!-- Eat Portion Modal -->
    <transition name="fade">
      <div v-if="showEatModal" class="modal-overlay" @click.self="showEatModal = false">
        <div class="modal-card nordic-card">
          <div class="modal-header">
            <div class="badge badge-ai">
              <Utensils :size="12" />
              <span>З'їсти порцію</span>
            </div>
            <button class="close-btn" @click="showEatModal = false">
              <X :size="18" />
            </button>
          </div>

          <div class="modal-body">
            <h3 class="eat-dish-title">{{ product.name }}</h3>
            <p class="eat-dish-subtitle">
              Доступно в холодильнику: <strong>{{ product.quantity }} {{ product.unit }}</strong>
            </p>

            <!-- Portion Selector -->
            <div class="portion-select-group">
              <span class="field-label">Скільки порцій з'їсти?</span>
              <div class="quick-portion-chips">
                <button
                  type="button"
                  :class="['chip-btn', selectedPortions === 0.5 ? 'active' : '']"
                  :disabled="product.quantity < 0.5"
                  @click="selectedPortions = 0.5"
                >
                  0.5
                </button>
                <button
                  type="button"
                  :class="['chip-btn', selectedPortions === 1 ? 'active' : '']"
                  :disabled="product.quantity < 1"
                  @click="selectedPortions = 1"
                >
                  1 порція
                </button>
                <button
                  type="button"
                  :class="['chip-btn', selectedPortions === 1.5 ? 'active' : '']"
                  :disabled="product.quantity < 1.5"
                  @click="selectedPortions = 1.5"
                >
                  1.5
                </button>
                <button
                  type="button"
                  :class="['chip-btn', selectedPortions === 2 ? 'active' : '']"
                  :disabled="product.quantity < 2"
                  @click="selectedPortions = 2"
                >
                  2 порції
                </button>
                <button
                  type="button"
                  :class="['chip-btn', selectedPortions === product.quantity ? 'active' : '']"
                  @click="selectedPortions = product.quantity"
                >
                  Всі ({{ product.quantity }})
                </button>
              </div>

              <!-- Stepper -->
              <div class="stepper-row">
                <button
                  class="stepper-btn"
                  :disabled="selectedPortions <= 0.5"
                  @click="selectedPortions = Math.max(0.5, Number((selectedPortions - 0.5).toFixed(1)))"
                >
                  <Minus :size="14" />
                </button>
                <span class="stepper-val">{{ selectedPortions }} <small>{{ product.unit }}</small></span>
                <button
                  class="stepper-btn"
                  :disabled="selectedPortions >= product.quantity"
                  @click="selectedPortions = Math.min(product.quantity, Number((selectedPortions + 0.5).toFixed(1)))"
                >
                  <Plus :size="14" />
                </button>
              </div>
            </div>

            <!-- Meal Type Selector -->
            <div class="meal-type-group">
              <span class="field-label">Прийом їжі для щоденника:</span>
              <div class="meal-type-chips">
                <button
                  type="button"
                  :class="['meal-chip', selectedMealType === 'breakfast' ? 'active' : '']"
                  @click="selectedMealType = 'breakfast'"
                >
                  🌅 Сніданок
                </button>
                <button
                  type="button"
                  :class="['meal-chip', selectedMealType === 'lunch' ? 'active' : '']"
                  @click="selectedMealType = 'lunch'"
                >
                  🍲 Обід
                </button>
                <button
                  type="button"
                  :class="['meal-chip', selectedMealType === 'dinner' ? 'active' : '']"
                  @click="selectedMealType = 'dinner'"
                >
                  🌙 Вечеря
                </button>
                <button
                  type="button"
                  :class="['meal-chip', selectedMealType === 'snack' ? 'active' : '']"
                  @click="selectedMealType = 'snack'"
                >
                  🥪 Перекус
                </button>
              </div>
            </div>

            <!-- Calculated Macros Preview -->
            <div v-if="parsedMacros.hasMacros" class="macros-preview-strip">
              <div class="macro-cell">
                <span class="m-lbl">Калорії</span>
                <strong class="m-val">{{ parsedMacros.calories }} кКал</strong>
              </div>
              <div class="macro-cell">
                <span class="m-lbl">Білки</span>
                <strong class="m-val">{{ parsedMacros.protein }}г</strong>
              </div>
              <div class="macro-cell">
                <span class="m-lbl">Жири</span>
                <strong class="m-val">{{ parsedMacros.fat }}г</strong>
              </div>
              <div class="macro-cell">
                <span class="m-lbl">Вуглеводи</span>
                <strong class="m-val">{{ parsedMacros.carbs }}г</strong>
              </div>
            </div>

            <div v-if="eatSuccess" class="success-alert">
              <Check :size="16" />
              <span>Успішно з'їдено та внесено у щоденник!</span>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary btn-sm" @click="showEatModal = false">Скасувати</button>
            <button class="btn-primary btn-sm" :disabled="isEating || selectedPortions <= 0" @click="handleConfirmEat">
              <Utensils :size="14" />
              <span>{{ isEating ? 'Записуємо...' : `З'їсти ${selectedPortions} ${product.unit}` }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
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

.prepared-meal-action-row {
  margin: -2px 0 2px 0;
}

.eat-portion-btn {
  width: 100%;
  padding: 6px 8px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: var(--transition-fast);
}

.eat-portion-btn:hover:not(:disabled) {
  background: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.category-chip {
  font-size: 0.68rem;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  background: var(--bg-subtle);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.25;
}

.product-desc {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.expiry-date {
  font-size: 0.72rem;
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
  background: var(--bg-subtle);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
}

.qty-btn {
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-xs);
  transition: var(--transition-fast);
}

.qty-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.qty-val {
  font-weight: 600;
  font-size: 0.82rem;
  color: var(--text-primary);
}

.qty-val small {
  font-weight: 400;
  color: var(--text-muted);
  font-size: 0.72rem;
}

.delete-btn {
  color: var(--text-muted);
  padding: 4px;
  border-radius: var(--radius-xs);
  transition: var(--transition-fast);
}

.delete-btn:hover {
  color: var(--status-expired);
  background: var(--status-expired-bg);
}

/* Eat Portion Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
}

.modal-card {
  width: 100%;
  max-width: 480px;
  margin: auto;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
}

.modal-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-surface);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: var(--radius-xs);
  transition: var(--transition-fast);
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--bg-surface);
}

.eat-dish-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.eat-dish-subtitle {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin: -6px 0 2px 0;
}

.field-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.portion-select-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quick-portion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-btn {
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  font-size: 0.76rem;
  font-weight: 500;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.chip-btn:hover:not(:disabled) {
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.chip-btn.active {
  background: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
}

.chip-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stepper-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.stepper-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-fast);
}

.stepper-btn:hover:not(:disabled) {
  background: var(--bg-hover);
}

.stepper-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stepper-val {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 40px;
  text-align: center;
}

.stepper-val small {
  font-size: 0.72rem;
  font-weight: 400;
  color: var(--text-muted);
}

.meal-type-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meal-type-chips {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.meal-chip {
  padding: 6px 10px;
  border-radius: var(--radius-xs);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  transition: var(--transition-fast);
}

.meal-chip:hover {
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.meal-chip.active {
  background: var(--primary);
  color: var(--primary-foreground);
  border-color: var(--primary);
}

.macros-preview-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding: 8px 10px;
  background: var(--bg-surface);
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-subtle);
  text-align: center;
}

.m-lbl {
  display: block;
  font-size: 0.65rem;
  text-transform: uppercase;
  color: var(--text-muted);
}

.m-val {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
}

.success-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--status-fresh-bg);
  border: 1px solid var(--status-fresh-border);
  color: var(--status-fresh);
  border-radius: var(--radius-xs);
  font-size: 0.8rem;
  font-weight: 500;
}

.modal-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  background: var(--bg-surface);
}
</style>

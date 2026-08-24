<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { BrowserMultiFormatReader, type Result } from '@zxing/library';
import { Camera, Loader2, RefreshCw, ScanBarcode, X } from '@lucide/vue';

export type ScannedProduct = {
  barcode: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
};

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'resolved', product: ScannedProduct): void;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const readerRef = ref<BrowserMultiFormatReader | null>(null);
const locked = ref(false);
const status = ref<'scanning' | 'lookup' | 'error'>('scanning');
const errorMessage = ref<string | null>(null);

const STORE_URL = 'https://world.openfoodfacts.org/api/v0/product';

const startScanning = () => {
  if (!videoRef.value) return;
  locked.value = false;
  status.value = 'scanning';
  errorMessage.value = null;

  const reader = new BrowserMultiFormatReader();
  readerRef.value = reader;

  reader
    .decodeFromVideoDevice(null, videoRef.value, async (result: Result | undefined, err) => {
      if (locked.value) return;
      if (err && err.name !== 'NotFoundException') return;
      if (!result) return;

      const text = result.getText();
      if (!text || !/^[0-9]{6,14}$/.test(text)) return;

      locked.value = true;
      reader.reset();
      status.value = 'lookup';

      try {
        const product = await lookupOpenFoodFacts(text);
        if (!product) {
          status.value = 'error';
          errorMessage.value = 'Товар за цим штрих-кодом не знайдено в базі OpenFoodFacts.';
          return;
        }
        emit('resolved', product);
        emit('close');
      } catch (e: any) {
        status.value = 'error';
        errorMessage.value = e.message || 'Помилка пошуку товару за штрих-кодом.';
      }
    })
    .catch((err: any) => {
      status.value = 'error';
      errorMessage.value =
        err.name === 'NotAllowedError'
          ? 'Доступ до камери відхилено. Надайте дозвіл у браузері.'
          : err.message || 'Не вдалося запустити камеру.';
    });
};

const stopScanning = () => {
  if (readerRef.value) {
    readerRef.value.reset();
    readerRef.value = null;
  }
};

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      setTimeout(() => {
        startScanning();
      }, 200);
    } else {
      stopScanning();
    }
  }
);

onUnmounted(() => {
  stopScanning();
});

const retry = () => {
  stopScanning();
  startScanning();
};

const mapCategoryTagsToSlug = (tags: string[]): string => {
  const flat = tags.join(' ').toLowerCase();
  if (/(milk|cheese|yogurt|butter|cream|dairy)/.test(flat)) return 'dairy';
  if (/(meat|fish|seafood|sausage|poultry|beef|pork|chicken)/.test(flat)) return 'meat-fish';
  if (/(vegetable|salad|herb|mushroom|green)/.test(flat)) return 'vegetables';
  if (/(fruit|berry|berries|apple|banana|orange)/.test(flat)) return 'fruits';
  if (/(bread|bakery|pastry|bun|cake|cookie)/.test(flat)) return 'bakery';
  if (/(pasta|grain|rice|flour|sugar|salt|cereal|oat)/.test(flat)) return 'pantry';
  if (/(chip|snack|sweet|chocolate|candy|nut)/.test(flat)) return 'snacks';
  if (/(water|juice|soda|coffee|tea|drink|beverage)/.test(flat)) return 'drinks';
  if (/(beer|wine|spirit|alcohol|liqueur|vodka)/.test(flat)) return 'alcohol';
  if (/(oil|vinegar|sauce|ketchup|mayo|spice|condiment)/.test(flat)) return 'sauces';
  if (/(frozen|ice-cream)/.test(flat)) return 'frozen';
  if (/(canned|preserve|ready-to-eat|ready-meal)/.test(flat)) return 'canned-prepared';
  return 'other';
};

const parseQuantity = (raw: string | undefined): { quantity: number; unit: string } => {
  if (!raw) return { quantity: 1, unit: 'шт' };
  const m = raw.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl)\b/i);
  if (!m) return { quantity: 1, unit: 'шт' };
  let qtyNum = parseFloat(m[1].replace(',', '.'));
  let unitStr = m[2].toLowerCase();
  if (unitStr === 'cl') {
    qtyNum = qtyNum * 10;
    unitStr = 'мл';
  } else if (unitStr === 'g') {
    unitStr = 'г';
  } else if (unitStr === 'kg') {
    unitStr = 'кг';
  } else if (unitStr === 'l') {
    unitStr = 'л';
  } else if (unitStr === 'ml') {
    unitStr = 'мл';
  }
  return { quantity: qtyNum, unit: unitStr };
};

async function lookupOpenFoodFacts(barcode: string): Promise<ScannedProduct | null> {
  const res = await fetch(`${STORE_URL}/${encodeURIComponent(barcode)}.json`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Помилка запиту OpenFoodFacts (${res.status})`);
  }
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const name = (p.product_name_uk || p.product_name || p.product_name_en || p.brands || 'Невідомий продукт').trim();
  const category = mapCategoryTagsToSlug(p.categories_tags ?? []);
  const { quantity, unit } = parseQuantity(p.quantity);
  return { barcode, name, category, unit, quantity };
}
</script>

<template>
  <transition name="fade">
    <div v-if="open" class="modal-overlay" @click.self="emit('close')">
      <div class="scanner-modal-content">
        <div class="modal-header">
          <div class="header-icon">
            <ScanBarcode :size="20" />
          </div>
          <div>
            <h3>Сканер штрих-кодів</h3>
            <p>Наведіть камеру на штрих-код товару</p>
          </div>
          <button class="close-btn" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <div class="video-wrapper">
          <video ref="videoRef" class="video-element" autoplay muted playsinline />

          <div v-if="status === 'lookup'" class="video-overlay">
            <Loader2 :size="32" class="animate-spin orange-icon" />
            <span>Пошук у базі OpenFoodFacts...</span>
          </div>

          <div v-if="status === 'scanning'" class="scan-pill">
            <Camera :size="14" />
            <span>Сканування...</span>
          </div>
        </div>

        <div v-if="errorMessage" class="error-banner">
          <X :size="16" class="shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="emit('close')">Скасувати</button>
          <button v-if="status === 'error'" type="button" class="btn-primary" @click="retry">
            <RefreshCw :size="16" />
            <span>Спробувати знову</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
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

.scanner-modal-content {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 440px;
  max-height: calc(100dvh - 32px);
  padding: 20px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.header-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-header p {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

.close-btn {
  position: absolute;
  top: 0;
  right: 0;
  color: var(--text-muted);
  padding: 4px;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.close-btn:hover {
  color: var(--text-primary);
  background: var(--bg-subtle);
}

.video-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: #000000;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #ffffff;
  font-size: 0.84rem;
  font-weight: 500;
}

.scan-pill {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 0.74rem;
  font-weight: 600;
}

.error-banner {
  padding: 10px 12px;
  border-radius: var(--radius-xs);
  background: var(--status-expired-bg);
  color: var(--status-expired);
  border: 1px solid var(--status-expired-border);
  font-size: 0.8rem;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}

.orange-icon {
  color: var(--status-fresh);
}
</style>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { BrowserMultiFormatReader, type Result } from '@zxing/library';
import { useI18n } from '@/i18n';
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

const { t } = useI18n();

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
          errorMessage.value = t('barcodeNotFound') || 'Товар за цим штрих-кодом не знайдено в базі OpenFoodFacts.';
          return;
        }
        emit('resolved', product);
        emit('close');
      } catch (e: any) {
        status.value = 'error';
        errorMessage.value = e.message || t('barcodeLookupError') || 'Помилка пошуку товару за штрих-кодом.';
      }
    })
    .catch((err: any) => {
      status.value = 'error';
      errorMessage.value =
        err.name === 'NotAllowedError'
          ? (t('barcodeCameraDenied') || 'Доступ до камери відхилено. Надайте дозвіл у браузері.')
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
    throw new Error(`Помилка OpenFoodFacts (${res.status})`);
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
      <div class="modal-card nordic-card">
        <div class="modal-header">
          <div class="header-title-box">
            <ScanBarcode :size="18" />
            <div>
              <h3>{{ t('barcodeScannerTitle') || 'Сканер штрих-кодів' }}</h3>
              <p class="header-sub">{{ t('barcodeScannerDesc') || 'Наведіть камеру на штрих-код' }}</p>
            </div>
          </div>
          <button class="close-btn" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <div class="video-wrapper">
          <video ref="videoRef" class="video-element" autoplay muted playsinline />

          <div v-if="status === 'lookup'" class="video-overlay">
            <Loader2 :size="28" class="spin-icon" />
            <span>{{ t('barcodeLookupLoading') || 'Пошук в базі OpenFoodFacts...' }}</span>
          </div>

          <div v-if="status === 'scanning'" class="scan-pill">
            <Camera :size="13" />
            <span>{{ t('barcodeScanning') || 'Сканування...' }}</span>
          </div>
        </div>

        <div v-if="errorMessage" class="error-banner">
          <X :size="15" />
          <span>{{ errorMessage }}</span>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary btn-sm" @click="emit('close')">{{ t('actionCancel') || 'Скасувати' }}</button>
          <button v-if="status === 'error'" type="button" class="btn-primary btn-sm" @click="retry">
            <RefreshCw :size="14" />
            <span>{{ t('actionRetry') || 'Спробувати знову' }}</span>
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
  z-index: 200;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card {
  width: 100%;
  max-width: 440px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title-box h3 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
}

.header-sub {
  font-size: 0.74rem;
  color: var(--text-muted);
  margin: 2px 0 0 0;
}

.video-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-xs);
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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #ffffff;
  font-size: 0.82rem;
}

.scan-pill {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 0.74rem;
}

.error-banner {
  padding: 8px 12px;
  border-radius: var(--radius-xs);
  background: var(--status-expired-bg);
  color: var(--status-expired);
  border: 1px solid var(--status-expired-border);
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle);
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>

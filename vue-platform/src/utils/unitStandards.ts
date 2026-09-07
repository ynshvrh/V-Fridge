/**
 * Unified standard for measurement units across the V-Fridge ecosystem.
 * Provides canonical unit keys, normalization, localized display names (Ukrainian / English),
 * and dropdown options.
 */

export type CanonicalUnit =
  | 'pcs'
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'tbsp'
  | 'tsp'
  | 'pinch'
  | 'clove'
  | 'servings'
  | 'pack';

export interface UnitOption {
  value: CanonicalUnit;
  label: string;
}

export const CANONICAL_UNITS: CanonicalUnit[] = [
  'pcs',
  'g',
  'kg',
  'ml',
  'l',
  'tbsp',
  'tsp',
  'pinch',
  'clove',
  'servings',
  'pack'
];

export const COMMON_UNITS: CanonicalUnit[] = [
  'pcs',
  'g',
  'kg',
  'ml',
  'l',
  'pack',
  'servings'
];

const DISPLAY_NAMES: Record<CanonicalUnit, { uk: string; en: string }> = {
  pcs: { uk: 'шт', en: 'pcs' },
  g: { uk: 'г', en: 'g' },
  kg: { uk: 'кг', en: 'kg' },
  ml: { uk: 'мл', en: 'ml' },
  l: { uk: 'л', en: 'l' },
  tbsp: { uk: 'ст. л.', en: 'tbsp' },
  tsp: { uk: 'ч. л.', en: 'tsp' },
  pinch: { uk: 'дрібка', en: 'pinch' },
  clove: { uk: 'зубчик', en: 'clove' },
  servings: { uk: 'порц', en: 'servings' },
  pack: { uk: 'уп', en: 'pack' }
};

const LONG_NAMES: Record<CanonicalUnit, { uk: string; en: string }> = {
  pcs: { uk: 'шт (штуки)', en: 'pcs (pieces)' },
  g: { uk: 'г (грами)', en: 'g (grams)' },
  kg: { uk: 'кг (кілограми)', en: 'kg (kilograms)' },
  ml: { uk: 'мл (мілілітри)', en: 'ml (milliliters)' },
  l: { uk: 'л (літри)', en: 'l (liters)' },
  tbsp: { uk: 'ст. л. (столові ложки)', en: 'tbsp (tablespoons)' },
  tsp: { uk: 'ч. л. (чайні ложки)', en: 'tsp (teaspoons)' },
  pinch: { uk: 'дрібка', en: 'pinch' },
  clove: { uk: 'зубчик', en: 'clove' },
  servings: { uk: 'порцій (порції)', en: 'servings' },
  pack: { uk: 'уп (упаковки)', en: 'pack (packages)' }
};

/**
 * Normalizes any localized or slang unit string into its canonical key.
 */
export function normalizeUnit(unit?: string | null): CanonicalUnit | string {
  if (!unit || !unit.trim()) return 'pcs';
  const u = unit.trim().toLowerCase().replace(/\.$/, '');

  switch (u) {
    case 'кг':
    case 'kg':
    case 'кілограм':
    case 'кілограмів':
    case 'килограмм':
    case 'килограм':
      return 'kg';
    case 'г':
    case 'g':
    case 'грам':
    case 'грамів':
    case 'грамм':
    case 'гр':
      return 'g';
    case 'л':
    case 'l':
    case 'літр':
    case 'літрів':
    case 'литр':
      return 'l';
    case 'мл':
    case 'ml':
    case 'мілілітр':
    case 'мілілітрів':
    case 'миллилитр':
      return 'ml';
    case 'шт':
    case 'pcs':
    case 'штук':
    case 'штуки':
    case 'штука':
    case 'pc':
    case 'piece':
    case 'pieces':
      return 'pcs';
    case 'ст.л':
    case 'ст. л':
    case 'ст л':
    case 'столова ложка':
    case 'столові ложки':
    case 'tbsp':
    case 'tablespoon':
      return 'tbsp';
    case 'ч.л':
    case 'ч. л':
    case 'ч л':
    case 'чайна ложка':
    case 'чайні ложки':
    case 'tsp':
    case 'teaspoon':
      return 'tsp';
    case 'дрібка':
    case 'щепотка':
    case 'pinch':
      return 'pinch';
    case 'зубчик':
    case 'зубчики':
    case 'зубчиків':
    case 'clove':
    case 'cloves':
      return 'clove';
    case 'порція':
    case 'порції':
    case 'порцій':
    case 'порц':
    case 'serving':
    case 'servings':
      return 'servings';
    case 'уп':
    case 'упак':
    case 'упаковка':
    case 'упаковки':
    case 'pack':
    case 'packs':
    case 'pkg':
      return 'pack';
    default:
      return u;
  }
}

/**
 * Returns the short localized display unit for rendering badges and quantities.
 */
export function formatUnit(unit?: string | null, language: string = 'uk'): string {
  if (!unit || !unit.trim()) return language === 'en' ? 'pcs' : 'шт';
  const norm = normalizeUnit(unit) as CanonicalUnit;
  const lang = language === 'en' ? 'en' : 'uk';
  if (DISPLAY_NAMES[norm]) {
    return DISPLAY_NAMES[norm][lang];
  }
  return unit.trim();
}

/**
 * Returns options for `<select>` inputs with canonical values and localized descriptive labels.
 */
export function getUnitOptions(language: string = 'uk', commonOnly: boolean = false): UnitOption[] {
  const lang = language === 'en' ? 'en' : 'uk';
  const list = commonOnly ? COMMON_UNITS : CANONICAL_UNITS;

  return list.map((u) => ({
    value: u,
    label: LONG_NAMES[u]?.[lang] || u
  }));
}

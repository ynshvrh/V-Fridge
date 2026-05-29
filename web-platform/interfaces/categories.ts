// Mirrors src/VFridge.Api/Contracts/ProductCategories.cs in the API repo.
// Keep these two in sync — the API DB CHECK constraint enforces this set.

export const PRODUCT_CATEGORIES = [
  { slug: "dairy",           label: "Dairy" },
  { slug: "meat-fish",       label: "Meat & fish" },
  { slug: "vegetables",      label: "Vegetables & greens" },
  { slug: "fruits",          label: "Fruits & berries" },
  { slug: "bakery",          label: "Bread & bakery" },
  { slug: "pantry",          label: "Pantry staples" },
  { slug: "snacks",          label: "Snacks & sweets" },
  { slug: "drinks",          label: "Drinks" },
  { slug: "alcohol",         label: "Alcohol" },
  { slug: "sauces",          label: "Sauces, oils & spices" },
  { slug: "frozen",          label: "Frozen" },
  { slug: "canned-prepared", label: "Canned & ready-to-eat" },
  { slug: "other",           label: "Other" },
] as const;

export type ProductCategorySlug = (typeof PRODUCT_CATEGORIES)[number]["slug"];

const labelMap: Record<string, string> = Object.fromEntries(
  PRODUCT_CATEGORIES.map((c) => [c.slug, c.label]),
);

const KEY_BY_SLUG: Record<string, string> = {
  "dairy": "categoryDairy",
  "meat-fish": "categoryMeatFish",
  "vegetables": "categoryVegetables",
  "fruits": "categoryFruits",
  "bakery": "categoryBakery",
  "pantry": "categoryPantry",
  "snacks": "categorySnacks",
  "drinks": "categoryDrinks",
  "alcohol": "categoryAlcohol",
  "sauces": "categorySauces",
  "frozen": "categoryFrozen",
  "canned-prepared": "categoryCannedPrepared",
  "other": "categoryOther",
};

/** Slug → translation key. Pair with next-intl's `useTranslations()`. */
export function categoryLabelKey(slug: string | null | undefined): string {
  if (!slug) return "categoryOther";
  return KEY_BY_SLUG[slug] ?? "categoryOther";
}

/** Legacy English-only label. Prefer `categoryLabelKey` + `t()` in new code. */
export function categoryLabel(slug: string | null | undefined): string {
  if (!slug) return "Other";
  return labelMap[slug] ?? "Other";
}

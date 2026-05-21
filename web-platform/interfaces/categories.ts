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

export function categoryLabel(slug: string | null | undefined): string {
  if (!slug) return "Other";
  return labelMap[slug] ?? "Other";
}

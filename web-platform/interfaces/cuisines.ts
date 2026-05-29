// Mirrors src/VFridge.Api/Contracts/SupportedCuisines.cs in the API repo.
// Keep these in sync — the API DB CHECK constraint enforces this set.
// Labels live in messages/{en,uk}.json under `cuisine{Slug}` keys.

export const CUISINE_SLUGS = [
  "any",
  "ukrainian",
  "georgian",
  "italian",
  "french",
  "mexican",
  "middle-eastern",
  "indian",
  "chinese",
  "japanese",
  "thai",
  "american",
] as const;

export type CuisineSlug = (typeof CUISINE_SLUGS)[number];

// Slug → translation key. Used by settings cuisine picker.
const KEY_BY_SLUG: Record<string, string> = {
  "any": "cuisineAny",
  "ukrainian": "cuisineUkrainian",
  "georgian": "cuisineGeorgian",
  "italian": "cuisineItalian",
  "french": "cuisineFrench",
  "mexican": "cuisineMexican",
  "middle-eastern": "cuisineMiddleEastern",
  "indian": "cuisineIndian",
  "chinese": "cuisineChinese",
  "japanese": "cuisineJapanese",
  "thai": "cuisineThai",
  "american": "cuisineAmerican",
};

export function cuisineLabelKey(slug: string | null | undefined): string {
  if (!slug) return "cuisineAny";
  return KEY_BY_SLUG[slug] ?? "cuisineAny";
}

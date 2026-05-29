"use client";

import { apiFetch } from "@/lib/api-client";

export const SUPPORTED_LOCALES = ["en", "uk"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALE_COOKIE = "vf_locale";

function writeCookie(locale: Locale) {
  // 1-year persistence; SameSite=Lax so it survives same-site navigations and
  // is sent on the next server render that picks up the new dictionary.
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

/**
 * Switch the UI language. Writes the cookie that `i18n/request.ts` reads,
 * mirrors the preference to the API (best-effort — failure is non-blocking),
 * and forces a full reload so server components re-render with the new
 * dictionary. Triggered from the settings page picker.
 */
export async function switchLocale(locale: Locale): Promise<void> {
  writeCookie(locale);
  try {
    await apiFetch("/auth/me/preferences", {
      method: "PATCH",
      body: { preferredLanguage: locale },
    });
  } catch {
    // Server-side persistence is convenience; the cookie alone is enough to
    // pick the right dictionary on the next load.
  }
  window.location.reload();
}

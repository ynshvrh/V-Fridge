"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
  /** The user's persisted preference. */
  mode: ThemeMode;
  /** What is currently rendered after resolving "system". */
  resolved: "light" | "dark";
  setMode: (next: ThemeMode) => void;
};

const STORAGE_KEY = "vf_theme";
const STORAGE_EVENT = "vf_theme_changed";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}

function applyClass(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

// External store: localStorage[STORAGE_KEY]. Same-tab writes dispatch a custom event
// so the subscriber re-reads; cross-tab writes come in via the native 'storage' event.
function subscribeToStoredMode(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  window.addEventListener(STORAGE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(STORAGE_EVENT, cb);
  };
}

// External store: system color-scheme preference.
function subscribeToSystemPref(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

const getSystemPref = (): "light" | "dark" =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const getSystemPrefServer = (): "light" | "dark" => "light";

const getStoredModeServer = (): ThemeMode => "system";

import { usePreferencesStore } from "@/store/usePreferencesStore";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribeToStoredMode, readStoredMode, getStoredModeServer);
  const systemPref = useSyncExternalStore(subscribeToSystemPref, getSystemPref, getSystemPrefServer);
  const { lightAccentTheme, darkAccentTheme, ambientGlow, hoverGlow, highContrast } = usePreferencesStore();

  const resolved: "light" | "dark" = mode === "system" ? systemPref : mode;

  // Push the resolved theme onto <html>. Idempotent — the bootstrap script in <head>
  // already set it before paint, but we still need this for in-session toggles.
  useEffect(() => {
    applyClass(resolved);
  }, [resolved]);

  // Sync and apply accent color theme class
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("accent-citrus", "accent-strawberry", "accent-blueberry", "accent-lime");
    
    const activeAccent = resolved === "dark" ? darkAccentTheme : lightAccentTheme;
    root.classList.add(`accent-${activeAccent}`);
  }, [resolved, lightAccentTheme, darkAccentTheme]);

  // Apply other interactive preferences
  useEffect(() => {
    if (typeof window === "undefined") return;
    const body = document.body;
    
    // Ambient glow
    body.classList.toggle("bg-ambient", ambientGlow);
    body.classList.toggle("pref-no-ambient", !ambientGlow);
    
    // Hover glow
    body.classList.toggle("pref-hover-glow", hoverGlow);
    
    // High contrast
    body.classList.toggle("pref-high-contrast", highContrast);
  }, [ambientGlow, hoverGlow, highContrast]);

  const setMode = useCallback((next: ThemeMode) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, next);
    // Notify subscribers in this tab (the 'storage' event only fires cross-tab).
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }, []);

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}

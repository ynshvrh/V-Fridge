"use client";

import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemeMode; labelKey: string; icon: typeof Sun }[] = [
  { value: "light", labelKey: "settingsThemeLight", icon: Sun },
  { value: "dark", labelKey: "settingsThemeDark", icon: Moon },
  { value: "system", labelKey: "settingsThemeSystem", icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations();
  const { mode, setMode } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label={t("settingsAppearance")}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border/70 bg-card/60 p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, labelKey, icon: Icon }) => {
        const selected = mode === value;
        const label = t(labelKey);
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            title={label}
            onClick={() => setMode(value)}
            className={cn(
              "inline-flex items-center justify-center h-7 w-7 rounded-full transition-colors",
              selected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

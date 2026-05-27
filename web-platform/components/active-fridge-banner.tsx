"use client";

import type { LucideIcon } from "lucide-react";
import { useFridges } from "@/providers/fridge-provider";

/**
 * Slim banner that names the active fridge on inventory-scoped pages
 * (Dashboard, Shopping, Planner). Hidden until at least one fridge is loaded so
 * we don't flash placeholder text.
 */
export function ActiveFridgeBanner({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  const { active } = useFridges();
  if (!active) return null;
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-sm">
      <Icon className="h-4 w-4 text-secondary-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-secondary-foreground">{active.name}</span>
    </div>
  );
}

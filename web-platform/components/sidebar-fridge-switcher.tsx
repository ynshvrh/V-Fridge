"use client";

import { Refrigerator } from "lucide-react";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFridges } from "@/providers/fridge-provider";

/**
 * Active-fridge selector that lives above the navigation. Renders a static badge
 * when the user only has one fridge; with two or more it becomes a dropdown that
 * updates the pinned id (and triggers every page to refetch via FridgeProvider).
 */
export function SidebarFridgeSwitcher() {
  const { fridges, active, setActive, status } = useFridges();

  if (status !== "ready" || !active) return null;

  if (fridges.length === 1) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          Active fridge
        </SidebarGroupLabel>
        <div className="flex w-full items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
            <Refrigerator className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-bold">{active.name}</span>
            <span className="block text-[11px] text-muted-foreground">
              {active.memberCount} {active.memberCount === 1 ? "member" : "members"}
            </span>
          </span>
        </div>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
        Active fridge
      </SidebarGroupLabel>
      <Select
        value={String(active.id)}
        onValueChange={(v) => {
          const id = Number.parseInt(v, 10);
          if (Number.isFinite(id)) setActive(id);
        }}
      >
        <SelectTrigger className="w-full h-auto rounded-lg border-border/70 bg-background py-2 pl-2 pr-3">
          <div className="flex w-full items-center gap-3 text-left">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
              <Refrigerator className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-bold">{active.name}</span>
              <span className="block text-[11px] text-muted-foreground">
                {active.memberCount} {active.memberCount === 1 ? "member" : "members"}
              </span>
            </span>
          </div>
          <SelectValue className="hidden" />
        </SelectTrigger>
        <SelectContent align="start">
          {fridges.map((f) => (
            <SelectItem key={f.id} value={String(f.id)}>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-medium">{f.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {f.role === "owner" ? "Owner" : "Member"} · {f.memberCount}{" "}
                  {f.memberCount === 1 ? "member" : "members"}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SidebarGroup>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, ChefHat, Loader2, Sparkles, ShoppingBasket } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";
import { categoryLabel } from "@/interfaces/categories";

type Meal = { name: string; day: string; ingredients: string[]; note: string | null };
type GapItem = { name: string; quantity: string | null; unit: string | null; category: string };
type MealPlan = { meals: Meal[]; gapItems: GapItem[] };

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function sortByDay(meals: Meal[]): Meal[] {
  return [...meals].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
}

export default function PlannerPage() {
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<MealPlan>("/meal-plan", { method: "POST" });
      setPlan(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to generate the plan"));
    } finally {
      setLoading(false);
    }
  };

  const importGaps = async () => {
    if (!plan || plan.gapItems.length === 0) return;
    setImporting(true);
    try {
      const resp = await apiFetch<{ created: number; skipped: number }>("/meal-plan/import-gaps", {
        method: "POST",
        body: { items: plan.gapItems },
      });
      toast.success(`${resp.created} added to shopping list${resp.skipped > 0 ? ` (${resp.skipped} already there)` : ""}`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to import gap items"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-full w-full p-4 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest">
              <CalendarDays className="h-3 w-3" />
              Meal planner
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">This week&apos;s menu</h1>
            <p className="text-base md:text-lg text-muted-foreground font-medium">
              Five weekday meals planned around what is in your fridge. Missing ingredients land in your shopping list with one click.
            </p>
          </div>
          <Button size="lg" onClick={generate} disabled={loading} className="rounded-xl font-bold gap-2 shadow-md shadow-primary/20 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {plan ? "Regenerate" : "Generate plan"}
          </Button>
        </header>

        {plan === null ? (
          <Card className="rounded-3xl border-2 border-dashed border-border bg-muted/20">
            <CardContent className="py-16 text-center space-y-3">
              <ChefHat className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-black tracking-tight">No plan yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Hit <strong>Generate plan</strong> and the AI chef will sketch out five meals from your inventory.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {sortByDay(plan.meals).map((meal, idx) => (
                <Card key={`${meal.day}-${idx}`} className="rounded-3xl border-border/60 shadow-sm bg-card">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {meal.day || "Day"}
                    </p>
                    <h3 className="text-lg font-black tracking-tight line-clamp-2">{meal.name}</h3>
                    {meal.note && (
                      <p className="text-xs italic text-muted-foreground line-clamp-2">{meal.note}</p>
                    )}
                    <div className="pt-2 border-t border-border/60">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                        Ingredients
                      </p>
                      <ul className="text-xs space-y-0.5 list-disc list-inside">
                        {meal.ingredients.map((i, ix) => (
                          <li key={ix}>{i}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>

            {plan.gapItems.length > 0 && (
              <section className="rounded-3xl border border-border/60 bg-card p-6 md:p-8 space-y-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black tracking-tight">Missing ingredients</h2>
                    <p className="text-sm text-muted-foreground">
                      Not in your fridge yet — add them to the shopping list to be ready for the week.
                    </p>
                  </div>
                  <Button onClick={importGaps} disabled={importing} variant="secondary" className="rounded-xl font-bold gap-2 shrink-0">
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBasket className="h-4 w-4" />}
                    Add to shopping list
                  </Button>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {plan.gapItems.map((item, i) => (
                    <li key={i} className="rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-sm">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity != null ? `${item.quantity} ${item.unit ?? ""} · ` : ""}
                        {categoryLabel(item.category)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

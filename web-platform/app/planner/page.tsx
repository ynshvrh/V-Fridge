"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, ChefHat, Loader2, Sparkles, ShoppingBasket, ChevronDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";
import { categoryLabelKey } from "@/interfaces/categories";
import { useFridges } from "@/providers/fridge-provider";
import { ActiveFridgeBanner } from "@/components/active-fridge-banner";

type Meal = {
  name: string;
  day: string;
  ingredients: string[];
  note: string | null;
  description: string | null;
  steps: string[] | null;
};
type GapItem = { name: string; quantity: string | null; unit: string | null; category: string };
type MealPlan = { meals: Meal[]; gapItems: GapItem[]; generatedAt: string };

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
// Slug → translation key. Keeps the day order canonical (Monday = 0) while the
// label flips with the locale.
const DAY_KEY: Record<string, string> = {
  Monday: "plannerDayMonday",
  Tuesday: "plannerDayTuesday",
  Wednesday: "plannerDayWednesday",
  Thursday: "plannerDayThursday",
  Friday: "plannerDayFriday",
  Saturday: "plannerDaySaturday",
  Sunday: "plannerDaySunday",
};

function sortByDay(meals: Meal[]): Meal[] {
  return [...meals].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
}

export default function PlannerPage() {
  const t = useTranslations();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [regeneratingDay, setRegeneratingDay] = useState<string | null>(null);

  const activeFridgeId = useFridges().active?.id ?? null;

  // Each fridge has its own persisted plan. Reload whenever the active fridge
  // changes (including on mount) — apiFetch returns undefined for a 204
  // No-Content reply, which is how the API signals "nothing generated yet".
  useEffect(() => {
    if (activeFridgeId == null) {
      setPlan(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const cached = await apiFetch<MealPlan | undefined>("/meal-plan");
        if (!cancelled) setPlan(cached ?? null);
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, t("plannerLoadFailed")));
      }
    })();
    return () => { cancelled = true; };
  }, [activeFridgeId, t]);

  const generate = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<MealPlan>("/meal-plan", { method: "POST" });
      setPlan(data);
    } catch (err) {
      toast.error(getErrorMessage(err, t("plannerGenerateFailed")));
    } finally {
      setLoading(false);
    }
  };

  const regenerateDay = async (day: string) => {
    setRegeneratingDay(day);
    try {
      const updated = await apiFetch<MealPlan>("/meal-plan/regenerate-day", {
        method: "POST",
        body: { day },
      });
      setPlan(updated);
    } catch (err) {
      // Map known API error codes to friendly copy; fall back to the message.
      if (err instanceof ApiError) {
        if (err.status === 404) {
          toast.error(t("plannerRegenerateNotFound"));
          return;
        }
        if (err.status === 429) {
          toast.error(t("plannerRegenerateRateLimit"));
          return;
        }
      }
      toast.error(getErrorMessage(err, t("plannerRegenerateFailed")));
    } finally {
      setRegeneratingDay(null);
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
      const base = t("plannerImportResult", { created: resp.created });
      const suffix = resp.skipped > 0 ? t("plannerImportSkipped", { skipped: resp.skipped }) : "";
      toast.success(`${base}${suffix}`);
    } catch (err) {
      toast.error(getErrorMessage(err, t("plannerImportFailed")));
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
              {t("plannerTitle")}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">{t("plannerHeroTitle")}</h1>
            <p className="text-base md:text-lg text-muted-foreground font-medium">
              {t("plannerHeroSubtitle")}
            </p>
            <ActiveFridgeBanner icon={CalendarDays} label={t("plannerActiveFor")} />
          </div>
          <Button size="lg" onClick={generate} disabled={loading} className="rounded-xl font-bold gap-2 shadow-md shadow-primary/20 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {plan ? t("plannerRegenerate") : t("plannerGenerate")}
          </Button>
        </header>

        {plan === null ? (
          <Card className="rounded-3xl border-2 border-dashed border-border bg-muted/20">
            <CardContent className="py-16 text-center space-y-3">
              <ChefHat className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-black tracking-tight">{t("plannerEmptyTitle")}</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {t("plannerEmptyBody")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortByDay(plan.meals).map((meal, idx) => {
                const dayKey = DAY_KEY[meal.day];
                const dayLabel = dayKey ? t(dayKey) : (meal.day || t("plannerDayFallback"));
                const isExpanded = expandedDay === meal.day;
                const isRegenerating = regeneratingDay === meal.day;
                const panelId = `meal-panel-${meal.day}-${idx}`;
                return (
                  <Card key={`${meal.day}-${idx}`} className="rounded-3xl border-border/60 shadow-sm bg-card overflow-hidden">
                    <CardContent className="p-5 space-y-3">
                      <button
                        type="button"
                        onClick={() => setExpandedDay((prev) => (prev === meal.day ? null : meal.day))}
                        aria-expanded={isExpanded}
                        aria-controls={panelId}
                        className="flex w-full items-start justify-between gap-2 text-left"
                      >
                        <div className="space-y-1 min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {dayLabel}
                          </p>
                          <h3 className="text-lg font-black tracking-tight line-clamp-2">{meal.name}</h3>
                        </div>
                        <ChevronDown
                          className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isExpanded && (
                        <div id={panelId} className="space-y-4 pt-1">
                          {meal.description && (
                            <p className="text-sm text-muted-foreground">{meal.description}</p>
                          )}

                          {meal.note && (
                            <p className="text-xs italic text-muted-foreground">{meal.note}</p>
                          )}

                          {meal.steps && meal.steps.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {t("plannerStepsLabel")}
                              </p>
                              <ol className="text-sm space-y-1.5 list-decimal list-inside">
                                {meal.steps.map((step, ix) => (
                                  <li key={ix} className="pl-1">{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}

                          <div className="pt-2 border-t border-border/60">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                              {t("plannerIngredientsLabel")}
                            </p>
                            <ul className="text-xs space-y-0.5 list-disc list-inside">
                              {meal.ingredients.map((i, ix) => (
                                <li key={ix}>{i}</li>
                              ))}
                            </ul>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full rounded-xl gap-2 font-bold"
                            onClick={() => regenerateDay(meal.day)}
                            disabled={isRegenerating}
                          >
                            {isRegenerating
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <RefreshCw className="h-4 w-4" />}
                            {isRegenerating ? t("plannerRegenerateDayBusy") : t("plannerRegenerateDay")}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            {plan.gapItems.length > 0 && (
              <section className="rounded-3xl border border-border/60 bg-card p-6 md:p-8 space-y-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black tracking-tight">{t("plannerMissingIngredients")}</h2>
                    <p className="text-sm text-muted-foreground">
                      {t("plannerMissingHint")}
                    </p>
                  </div>
                  <Button onClick={importGaps} disabled={importing} variant="secondary" className="rounded-xl font-bold gap-2 shrink-0">
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBasket className="h-4 w-4" />}
                    {t("plannerAddToShopping")}
                  </Button>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {plan.gapItems.map((item, i) => (
                    <li key={i} className="rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-sm">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity != null ? `${item.quantity} ${item.unit ?? ""} · ` : ""}
                        {t(categoryLabelKey(item.category))}
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

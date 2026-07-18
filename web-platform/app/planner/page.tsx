"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, ChefHat, Loader2, Sparkles, ShoppingBasket, RefreshCw, Check, Flame, Plus, Coffee, Soup, Salad, Lightbulb, Refrigerator, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";
import { categoryLabelKey } from "@/interfaces/categories";
import { useFridges } from "@/providers/fridge-provider";
import { ActiveFridgeBanner } from "@/components/active-fridge-banner";
import Link from "next/link";
import { useProductStore, usePlannerStore, type Meal, type GapItem, type MealPlan } from "@/store/useVFridgeStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const mealTypes = ["breakfast", "lunch", "dinner"];

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



export default function PlannerPage() {
  const t = useTranslations() as unknown as (key: string, values?: Record<string, string | number>) => string;
  const { plan, setPlan } = usePlannerStore();
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [loadingRecipeMealKey, setLoadingRecipeMealKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Sheet state
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [regeneratingMealKey, setRegeneratingMealKey] = useState<string | null>(null);
  const [loggingToTrackerKey, setLoggingToTrackerKey] = useState<string | null>(null);
  const [loggedMeals, setLoggedMeals] = useState<Record<string, boolean>>({});

  const { fridges, status: fridgesStatus } = useFridges();
  const activeFridgeId = useFridges().active?.id ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

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
  }, [activeFridgeId, t, setPlan]);

  const generate = async () => {
    setLoading(true);
    try {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const currentDayName = days[new Date().getDay()];
      const data = await apiFetch<MealPlan>(`/meal-plan?currentDay=${currentDayName}`, { method: "POST" });
      setPlan(data);
    } catch (err) {
      toast.error(getErrorMessage(err, t("plannerGenerateFailed")));
    } finally {
      setLoading(false);
    }
  };

  const mealHasRecipe = (meal: Meal): boolean =>
    !!meal.description || (Array.isArray(meal.steps) && meal.steps.length > 0);

  const toggleMeal = async (meal: Meal) => {
    setSelectedMeal(meal);
    setCheckedIngredients({});
    const key = `${meal.day}-${meal.mealType || ""}`;
    if (!mealHasRecipe(meal)) {
      if (loadingRecipeMealKey === key) return;
      setLoadingRecipeMealKey(key);
      try {
        const updated = await apiFetch<MealPlan>("/meal-plan/recipe", {
          method: "POST",
          body: { day: meal.day, mealType: meal.mealType },
        });
        setPlan(updated);
        const updatedMeal = updated.meals.find(
          (m) => m.day === meal.day && m.mealType === meal.mealType
        );
        if (updatedMeal) {
          setSelectedMeal(updatedMeal);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 429) {
          toast.error(t("plannerRecipeRateLimit"));
          return;
        }
        toast.error(getErrorMessage(err, t("plannerRecipeFailed")));
      } finally {
        setLoadingRecipeMealKey(null);
      }
    }
  };



  const handleRegenerateMeal = async (day: string, mealType: string) => {
    const key = `${day}-${mealType}`;
    setRegeneratingMealKey(key);
    try {
      const updated = await apiFetch<MealPlan>("/meal-plan/regenerate-meal", {
        method: "POST",
        body: { day, mealType },
      });
      setPlan(updated);

      const newMeal = updated.meals.find(
        (m) => m.day === day && m.mealType === mealType
      );
      if (newMeal) {
        setSelectedMeal(newMeal);
        setCheckedIngredients({});

        const recipeKey = `${newMeal.day}-${newMeal.mealType || ""}`;
        setLoadingRecipeMealKey(recipeKey);
        try {
          const recipeUpdated = await apiFetch<MealPlan>("/meal-plan/recipe", {
            method: "POST",
            body: { day: newMeal.day, mealType: newMeal.mealType },
          });
          setPlan(recipeUpdated);
          const finalMeal = recipeUpdated.meals.find(
            (m) => m.day === day && m.mealType === mealType
          );
          if (finalMeal) setSelectedMeal(finalMeal);
        } catch (err) {
          toast.error(getErrorMessage(err, t("plannerRecipeFailed")));
        } finally {
          setLoadingRecipeMealKey(null);
        }
      }
    } catch (err) {
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
      setRegeneratingMealKey(null);
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

  const toggleIngredient = (name: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const logMealToTracker = async (meal: Meal) => {
    const key = `${meal.day}-${meal.mealType || ""}`;
    setLoggingToTrackerKey(key);
    try {
      const dateStr = getLocalDateForWeekday(meal.day);
      await apiFetch("/nutrition/log", {
        method: "POST",
        body: {
          date: dateStr,
          mealType: meal.mealType || "lunch",
          foodName: meal.name,
          quantity: 1,
          unit: "serving",
          calories: meal.calories || 0,
          protein: meal.protein || 0,
          fat: meal.fat || 0,
          carbs: meal.carbs || 0,
        },
      });
      setLoggedMeals((prev) => ({ ...prev, [key]: true }));
      toast.success(t("plannerLogToTrackerSuccess", { name: meal.name }));

      // Deduct ingredients from the active fridge
      const { products: currentProducts, removeProduct, updateProduct } = useProductStore.getState();
      const updatedProductsToSave: Promise<any>[] = [];
      const localQuantities = new Map<number, number>();
      currentProducts.forEach((p) => localQuantities.set(p.id, p.quantity));

      if (Array.isArray(meal.ingredients)) {
        for (const ingredient of meal.ingredients) {
          const matchingProduct = currentProducts.find((p) => {
            const pNameLower = p.name.toLowerCase();
            const ingLower = ingredient.toLowerCase();
            return ingLower.includes(pNameLower) || pNameLower.includes(ingLower);
          });

          if (matchingProduct) {
            const currentQty = localQuantities.get(matchingProduct.id) ?? matchingProduct.quantity;
            if (currentQty <= 0) continue;

            const match = ingredient.trim().match(/^([\d\.,]+)\s*([a-zA-Zа-яА-ЯёЁіІїЇєЄґҐ]+)?/);
            let amountToDeduct = 1;
            let parsedUnit = "";
            if (match) {
              const parsedNum = parseFloat(match[1].replace(",", "."));
              if (!isNaN(parsedNum)) {
                amountToDeduct = parsedNum;
              }
              parsedUnit = match[2] ? match[2].toLowerCase() : "";
            }

            const productUnit = matchingProduct.unit ? matchingProduct.unit.toLowerCase() : "";
            const unitMatches =
              productUnit === parsedUnit ||
              (productUnit === "pcs" && (parsedUnit === "pcs" || parsedUnit === "шт" || !parsedUnit)) ||
              (productUnit === "шт" && (parsedUnit === "pcs" || parsedUnit === "шт" || !parsedUnit));

            const deduct = unitMatches ? amountToDeduct : 1;
            const newQty = Math.max(0, currentQty - deduct);
            localQuantities.set(matchingProduct.id, newQty);
          }
        }
      }

      for (const [productId, finalQty] of localQuantities.entries()) {
        const originalProduct = currentProducts.find((p) => p.id === productId);
        if (!originalProduct || originalProduct.quantity === finalQty) continue;

        if (finalQty <= 0) {
          updatedProductsToSave.push(
            apiFetch(`/products/${productId}`, { method: "DELETE" })
              .then(() => {
                removeProduct(productId);
              })
              .catch((err) => console.error("Failed to delete deducted product:", err))
          );
        } else {
          const updatedProduct = { ...originalProduct, quantity: finalQty };
          updatedProductsToSave.push(
            apiFetch(`/products/${productId}`, {
              method: "PATCH",
              body: { quantity: finalQty },
            })
              .then(() => {
                updateProduct(updatedProduct);
              })
              .catch((err) => console.error("Failed to update product quantity:", err))
          );
        }
      }

      if (updatedProductsToSave.length > 0) {
        await Promise.all(updatedProductsToSave);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to log meal."));
    } finally {
      setLoggingToTrackerKey(null);
    }
  };

  const getLocalDateForWeekday = (weekday: string): string => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, ...
    const currentDayNormalized = currentDay === 0 ? 7 : currentDay;

    const dayMap: Record<string, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7,
    };

    const targetDayNormalized = dayMap[weekday.toLowerCase()] || currentDayNormalized;
    const diff = targetDayNormalized - currentDayNormalized;

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);

    return targetDate.toISOString().split("T")[0];
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (fridgesStatus === "ready" && fridges.length === 0) {
    return (
      <div className="min-h-full w-full p-4 md:p-8 lg:p-12">
        <div className="max-w-2xl mx-auto pt-12">
          <Card className="rounded-3xl border-2 border-dashed border-border bg-muted/20">
            <CardContent className="py-16 px-8 text-center space-y-5">
              <div className="h-20 w-20 mx-auto rounded-2xl bg-secondary text-secondary-foreground grid place-items-center shadow-sm">
                <Refrigerator className="h-10 w-10" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">{t("fridgesNoneTitle")}</h1>
                <p className="text-sm md:text-base text-muted-foreground max-w-sm mx-auto">
                  {t("fridgesNoneBody")}
                </p>
              </div>
              <Button asChild size="lg" className="rounded-xl font-bold gap-2 shadow-md shadow-primary/20">
                <Link href="/settings">
                  <SettingsIcon className="h-4 w-4" />
                  {t("navSettings")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <div className="space-y-4">
              {weekdays.map((day) => {
                const dayKey = DAY_KEY[day];
                const dayLabel = dayKey ? t(dayKey) : day;
                const dayMeals = plan.meals.filter((m) => m.day === day);

                return (
                  <div
                    key={day}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-3xl bg-glass border border-border/40 shadow-xs hover:border-border/80 transition-colors"
                  >
                    {/* Day label column */}
                    <div className="md:w-32 shrink-0 md:text-center py-1 md:py-0">
                      <p className="text-lg font-black tracking-tight text-primary">
                        {dayLabel}
                      </p>
                      <p className="text-xs text-muted-foreground hidden md:block">
                        {dayMeals.length} {t("dashboardItemsCount", { count: dayMeals.length })}
                      </p>
                    </div>

                    {/* Meal types cells grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                      {mealTypes.map((mealType) => {
                        const meal = dayMeals.find((m) => m.mealType?.toLowerCase() === mealType);
                        const mealKey = `${day}-${mealType}`;
                        const mealTypeLabel = t(`mealType${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`);

                        if (!meal) {
                          return (
                            <div
                              key={mealKey}
                              className="rounded-2xl border border-dashed border-border/60 bg-muted/10 p-4 flex flex-col justify-center items-center text-center min-h-[90px]"
                            >
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                {mealTypeLabel}
                              </span>
                              <span className="text-xs text-muted-foreground/40 mt-1">
                                {t("plannerEmptyTitle")}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={mealKey}
                            type="button"
                            onClick={() => toggleMeal(meal)}
                            className="group text-left rounded-2xl bg-secondary/20 hover:bg-secondary/40 border border-border/50 p-4 shadow-xs hover:shadow-sm hover:scale-[1.02] transition-all duration-300 active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[100px]"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                  {mealType === "breakfast" ? (
                                    <Coffee className="h-3.5 w-3.5 text-primary shrink-0" />
                                  ) : mealType === "lunch" ? (
                                    <Soup className="h-3.5 w-3.5 text-primary shrink-0" />
                                  ) : (
                                    <Salad className="h-3.5 w-3.5 text-primary shrink-0" />
                                  )}
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                                  {mealTypeLabel}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                {meal.name}
                              </h4>
                            </div>
                            {meal.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-2">
                                {meal.description}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gap items section */}
            {plan.gapItems.length > 0 && (
              <section className="rounded-3xl bg-glass p-6 md:p-8 space-y-4 shadow-sm">
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

        {/* Recipe details Slide-out Sheet */}
        <Sheet open={!!selectedMeal} onOpenChange={(open) => { if (!open) setSelectedMeal(null); }}>
          <SheetContent className="w-full sm:max-w-md p-6 bg-card/95 backdrop-blur-md overflow-y-auto flex flex-col gap-6 border-l border-border/60">
            {selectedMeal && (
              <>
                <SheetHeader className="p-0 text-left">
                  <div className="flex items-center gap-2">
                      {selectedMeal.mealType === "breakfast" ? (
                        <Coffee className="h-4 w-4 text-primary shrink-0" />
                      ) : selectedMeal.mealType === "lunch" ? (
                        <Soup className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Salad className="h-4 w-4 text-primary shrink-0" />
                      )}
                    <span className="text-[11px] font-black uppercase tracking-widest text-primary">
                      {selectedMeal.mealType
                        ? t(`mealType${selectedMeal.mealType.charAt(0).toUpperCase() + selectedMeal.mealType.slice(1).toLowerCase()}`)
                        : ""} • {DAY_KEY[selectedMeal.day] ? t(DAY_KEY[selectedMeal.day]) : selectedMeal.day}
                    </span>
                  </div>
                  <SheetTitle className="text-2xl font-black tracking-tight leading-tight mt-1">
                    {selectedMeal.name}
                  </SheetTitle>
                  {selectedMeal.description && (
                    <SheetDescription className="text-sm text-muted-foreground leading-relaxed mt-2">
                      {selectedMeal.description}
                    </SheetDescription>
                  )}
                </SheetHeader>

                {loadingRecipeMealKey === `${selectedMeal.day}-${selectedMeal.mealType || ""}` ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm font-semibold text-muted-foreground animate-pulse">
                      {t("plannerRecipeLoading")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 flex-1">
                    {selectedMeal.note && (
                      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-xs italic text-primary/90 leading-relaxed flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{selectedMeal.note}</span>
                      </div>
                    )}

                    {/* Nutritional Value */}
                    {selectedMeal.calories !== undefined && selectedMeal.calories > 0 && (
                      <div className="p-4 rounded-2xl bg-secondary/15 border border-border/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                            <Flame className="h-3.5 w-3.5 text-primary" />
                            {t("plannerNutrientsTitle")}
                          </h4>
                          <span className="text-xs font-black text-primary">
                            {selectedMeal.calories} {t("plannerCaloriesUnit")}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 rounded-xl bg-background/60 border border-border/25">
                            <span className="block text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                              {t("plannerProtein")}
                            </span>
                            <span className="font-black text-foreground">
                              {Math.round(selectedMeal.protein ?? 0)}g
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-background/60 border border-border/25">
                            <span className="block text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400">
                              {t("plannerFat")}
                            </span>
                            <span className="font-black text-foreground">
                              {Math.round(selectedMeal.fat ?? 0)}g
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-background/60 border border-border/25">
                            <span className="block text-[9px] uppercase font-bold text-cyan-600 dark:text-cyan-400">
                              {t("plannerCarbs")}
                            </span>
                            <span className="font-black text-foreground">
                              {Math.round(selectedMeal.carbs ?? 0)}g
                            </span>
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={() => logMealToTracker(selectedMeal)}
                          disabled={loggedMeals[`${selectedMeal.day}-${selectedMeal.mealType || ""}`] || loggingToTrackerKey === `${selectedMeal.day}-${selectedMeal.mealType || ""}`}
                          className="w-full h-9 rounded-xl gap-1.5 text-xs font-black shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all"
                        >
                          {loggingToTrackerKey === `${selectedMeal.day}-${selectedMeal.mealType || ""}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : loggedMeals[`${selectedMeal.day}-${selectedMeal.mealType || ""}`] ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          {loggingToTrackerKey === `${selectedMeal.day}-${selectedMeal.mealType || ""}`
                            ? t("plannerLogToTrackerBusy")
                            : loggedMeals[`${selectedMeal.day}-${selectedMeal.mealType || ""}`]
                            ? t("plannerLogToTrackerDone")
                            : t("plannerLogToTracker")}
                        </Button>
                      </div>
                    )}

                    {/* Ingredients Checklist */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        {t("plannerIngredientsLabel")}
                      </h4>
                      <ul className="grid grid-cols-1 gap-2">
                        {selectedMeal.ingredients.map((ing, ix) => {
                          const isChecked = checkedIngredients[ing];
                          return (
                            <li key={ix}>
                              <button
                                type="button"
                                onClick={() => toggleIngredient(ing)}
                                className="w-full flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-all text-left text-xs cursor-pointer select-none"
                              >
                                <div className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isChecked ? "bg-success border-success text-white" : "border-border/80"}`}>
                                  {isChecked && <Check className="h-3 w-3" />}
                                </div>
                                <span className={`font-medium transition-all ${isChecked ? "line-through text-muted-foreground/60" : ""}`}>
                                  {ing}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Cooking Steps Timeline */}
                    {selectedMeal.steps && selectedMeal.steps.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                          {t("plannerStepsLabel")}
                        </h4>
                        <ol className="relative border-l border-border/80 ml-3 space-y-5">
                          {selectedMeal.steps.map((step, ix) => (
                            <li key={ix} className="pl-6 relative">
                              <div className="absolute -left-3 top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-secondary border border-border text-[10px] font-black text-secondary-foreground shadow-xs select-none">
                                {ix + 1}
                              </div>
                              <p className="text-xs leading-relaxed text-foreground/90">{step}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-border/60 flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 rounded-xl gap-2 font-bold shadow-xs hover:border-destructive/30 hover:text-destructive transition-all"
                    onClick={() => handleRegenerateMeal(selectedMeal.day, selectedMeal.mealType || "")}
                    disabled={
                      regeneratingMealKey === `${selectedMeal.day}-${selectedMeal.mealType || ""}` ||
                      loadingRecipeMealKey != null
                    }
                  >
                    {regeneratingMealKey === `${selectedMeal.day}-${selectedMeal.mealType || ""}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {regeneratingMealKey === `${selectedMeal.day}-${selectedMeal.mealType || ""}`
                      ? t("plannerRegenerateMealBusy")
                      : t("plannerRegenerateMeal")}
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

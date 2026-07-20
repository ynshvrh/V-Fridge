"use client";

import { useEffect, useState } from "react";
import Chat from "@/components/chat";
import { useFridges } from "@/providers/fridge-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChefHat,
  Bookmark,
  Search,
  Trash2,
  Flame,
  Plus,
  Check,
  ShoppingBasket,
  Loader2,
  Refrigerator,
  Settings as SettingsIcon,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { useSavedRecipeStore, type SavedRecipe } from "@/store/useVFridgeStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export default function RecipePage() {
  const t = useTranslations() as unknown as (key: string, values?: Record<string, string | number>) => string;
  const { fridges, status: fridgesStatus } = useFridges();
  const [activeTab, setActiveTab] = useState<"chat" | "saved">("chat");

  // Saved recipes state
  const { savedRecipes, setSavedRecipes, removeSavedRecipe } = useSavedRecipeStore();
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loggingId, setLoggingId] = useState<number | null>(null);
  const [importingId, setImportingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingSaved(true);
      try {
        const list = await apiFetch<SavedRecipe[]>("/saved-recipes");
        if (!cancelled && Array.isArray(list)) {
          setSavedRecipes(list);
        }
      } catch (err) {
        console.error("Failed to load saved recipes:", err);
      } finally {
        if (!cancelled) setLoadingSaved(false);
      }
    })();
    return () => { cancelled = true; };
  }, [setSavedRecipes]);

  const handleDeleteRecipe = async (id: number) => {
    setDeletingId(id);
    try {
      await apiFetch(`/saved-recipes/${id}`, { method: "DELETE" });
      removeSavedRecipe(id);
      if (selectedRecipe?.id === id) setSelectedRecipe(null);
      toast.success(t("recipeRemoveSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete recipe."));
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogToTracker = async (recipe: SavedRecipe) => {
    setLoggingId(recipe.id);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      await apiFetch("/nutrition/log", {
        method: "POST",
        body: {
          date: todayStr,
          mealType: "lunch",
          foodName: recipe.name,
          quantity: 1,
          unit: "serving",
          calories: recipe.calories || 0,
          protein: recipe.protein || 0,
          fat: recipe.fat || 0,
          carbs: recipe.carbs || 0,
        },
      });
      toast.success(t("plannerLogToTrackerSuccess", { name: recipe.name }));
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to log recipe to tracker."));
    } finally {
      setLoggingId(null);
    }
  };

  const handleImportIngredients = async (recipe: SavedRecipe) => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) return;
    setImportingId(recipe.id);
    try {
      const gapItems = recipe.ingredients.map((ing) => ({
        name: ing,
        quantity: null,
        unit: null,
        category: "other",
      }));
      const resp = await apiFetch<{ created: number; skipped: number }>("/meal-plan/import-gaps", {
        method: "POST",
        body: { items: gapItems },
      });
      const base = t("plannerImportResult", { created: resp.created });
      const suffix = resp.skipped > 0 ? t("plannerImportSkipped", { skipped: resp.skipped }) : "";
      toast.success(`${base}${suffix}`);
    } catch (err) {
      toast.error(getErrorMessage(err, t("plannerImportFailed")));
    } finally {
      setImportingId(null);
    }
  };

  const filteredRecipes = savedRecipes.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (Array.isArray(r.ingredients) && r.ingredients.some((i) => i.toLowerCase().includes(q)))
    );
  });

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
    <div className="h-full w-full flex flex-col p-3 md:p-6">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col min-h-0 space-y-4">
        {/* Top Tab Bar Switcher: AI Chef vs Saved Recipes */}
        <div className="flex items-center justify-between bg-glass/30 border border-border/40 rounded-2xl p-1.5 shadow-2xs shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                activeTab === "chat"
                  ? "bg-primary text-primary-foreground shadow-sm scale-[1.01]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"
              }`}
            >
              <ChefHat className="h-4 w-4" />
              <span>{t("recipeTabChef")}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                activeTab === "saved"
                  ? "bg-primary text-primary-foreground shadow-sm scale-[1.01]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"
              }`}
            >
              <Bookmark className="h-4 w-4" />
              <span>{t("recipeTabSaved")}</span>
              {savedRecipes.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  activeTab === "saved" ? "bg-white/20 text-white" : "bg-primary/15 text-primary"
                }`}>
                  {savedRecipes.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: AI Chef Chat */}
        {activeTab === "chat" && (
          <main className="flex-1 min-h-0 relative flex flex-col">
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-secondary/40 via-transparent to-primary/10 blur-2xl opacity-60" />
            <div className="flex-1 h-full w-full rounded-3xl border border-border/60 shadow-2xl shadow-primary/5 bg-card overflow-hidden flex flex-col">
              <Chat />
            </div>
          </main>
        )}

        {/* Tab 2: Saved Recipes Gallery */}
        {activeTab === "saved" && (
          <div className="flex-1 min-h-0 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
            {/* Search & Filter Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-glass/20 border border-border/40 p-4 rounded-3xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Пошук збережених рецептів за назвою або інгредієнтом..."
                  className="pl-10 h-10 rounded-xl border-border/60 bg-background/60 text-xs font-medium"
                />
              </div>
              <span className="text-xs text-muted-foreground font-semibold shrink-0 self-end sm:self-center px-1">
                Збережено: {filteredRecipes.length}
              </span>
            </div>

            {loadingSaved && savedRecipes.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredRecipes.length === 0 ? (
              <Card className="rounded-3xl border-2 border-dashed border-border bg-muted/20 my-auto">
                <CardContent className="py-16 text-center space-y-3">
                  <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
                  <h3 className="text-xl font-black tracking-tight">{t("recipeNoSavedTitle")}</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {t("recipeNoSavedBody")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                {filteredRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setCheckedIngredients({});
                    }}
                    className="group text-left rounded-3xl bg-glass hover:bg-secondary/20 border border-border/50 p-5 shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-300 active:scale-[0.99] cursor-pointer flex flex-col justify-between min-h-[160px]"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/90 flex items-center gap-1">
                          <Bookmark className="h-3 w-3 text-primary fill-primary/20" />
                          Рецепт
                        </span>
                        {recipe.calories > 0 && (
                          <span className="text-[11px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {recipe.calories} кКал
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-base md:text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {recipe.name}
                      </h4>
                      {recipe.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {recipe.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground font-medium mt-3">
                      <span>{recipe.ingredients?.length || 0} інгредієнтів</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRecipe(recipe.id);
                        }}
                        disabled={deletingId === recipe.id}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Вилучити рецепт"
                      >
                        {deletingId === recipe.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recipe Details Sheet Modal */}
        <Sheet open={!!selectedRecipe} onOpenChange={(open) => { if (!open) setSelectedRecipe(null); }}>
          <SheetContent className="w-full sm:max-w-md p-6 bg-card/95 backdrop-blur-md overflow-y-auto flex flex-col gap-6 border-l border-border/60">
            {selectedRecipe && (
              <>
                <SheetHeader className="p-0 text-left">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-primary shrink-0 fill-primary/20" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-primary">
                      Збережений рецепт
                    </span>
                  </div>
                  <SheetTitle className="text-2xl font-black tracking-tight leading-tight mt-1">
                    {selectedRecipe.name}
                  </SheetTitle>
                  {selectedRecipe.description && (
                    <SheetDescription className="text-sm text-muted-foreground leading-relaxed mt-2">
                      {selectedRecipe.description}
                    </SheetDescription>
                  )}
                </SheetHeader>

                <div className="space-y-6 flex-1">
                  {/* Nutritional Value */}
                  {selectedRecipe.calories > 0 && (
                    <div className="p-4 rounded-2xl bg-secondary/15 border border-border/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 text-primary" />
                          {t("plannerNutrientsTitle")}
                        </h4>
                        <span className="text-xs font-black text-primary">
                          {selectedRecipe.calories} {t("plannerCaloriesUnit")}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded-xl bg-background/60 border border-border/25">
                          <span className="block text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                            {t("plannerProtein")}
                          </span>
                          <span className="font-black text-foreground">
                            {Math.round(selectedRecipe.protein)}g
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-background/60 border border-border/25">
                          <span className="block text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400">
                            {t("plannerFat")}
                          </span>
                          <span className="font-black text-foreground">
                            {Math.round(selectedRecipe.fat)}g
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-background/60 border border-border/25">
                          <span className="block text-[9px] uppercase font-bold text-cyan-600 dark:text-cyan-400">
                            {t("plannerCarbs")}
                          </span>
                          <span className="font-black text-foreground">
                            {Math.round(selectedRecipe.carbs)}g
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={() => handleLogToTracker(selectedRecipe)}
                        disabled={loggingId === selectedRecipe.id}
                        className="w-full h-9 rounded-xl gap-1.5 text-xs font-black shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all"
                      >
                        {loggingId === selectedRecipe.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        {t("plannerLogToTracker")}
                      </Button>
                    </div>
                  )}

                  {/* Ingredients List */}
                  {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                          {t("plannerIngredientsLabel")}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleImportIngredients(selectedRecipe)}
                          disabled={importingId === selectedRecipe.id}
                          className="h-7 text-[11px] font-bold gap-1 text-primary hover:text-primary"
                        >
                          {importingId === selectedRecipe.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShoppingBasket className="h-3 w-3" />}
                          В список покупок
                        </Button>
                      </div>
                      <ul className="grid grid-cols-1 gap-2">
                        {selectedRecipe.ingredients.map((ing, ix) => {
                          const isChecked = checkedIngredients[ing];
                          return (
                            <li key={ix}>
                              <button
                                type="button"
                                onClick={() => setCheckedIngredients((prev) => ({ ...prev, [ing]: !prev[ing] }))}
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
                  )}

                  {/* Cooking Steps Timeline */}
                  {selectedRecipe.steps && selectedRecipe.steps.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        {t("plannerStepsLabel")}
                      </h4>
                      <ol className="relative border-l border-border/80 ml-3 space-y-5">
                        {selectedRecipe.steps.map((step, ix) => (
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

                <div className="pt-4 border-t border-border/60 flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 rounded-xl gap-2 font-bold shadow-xs hover:border-destructive/30 hover:text-destructive transition-all"
                    onClick={() => handleDeleteRecipe(selectedRecipe.id)}
                    disabled={deletingId === selectedRecipe.id}
                  >
                    {deletingId === selectedRecipe.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Вилучити рецепт
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

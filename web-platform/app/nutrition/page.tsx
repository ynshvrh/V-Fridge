"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";
import { apiFetch } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Edit2,
  Flame,
  ChevronLeft,
  ChevronRight,
  Settings,
  Loader2,
  Activity,
  Calendar,
  Coffee,
  Soup,
  Salad,
  Cookie,
  Refrigerator,
} from "lucide-react";
import { useFridges } from "@/providers/fridge-provider";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useNutritionStore } from "@/store/useVFridgeStore";

type NutritionLog = {
  id: number;
  mealType: string;
  foodName: string;
  quantity: number | null;
  unit: string | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  loggedAt: string;
};

type NutritionTargets = {
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

type NutritionSummary = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

type DailyNutritionResponse = {
  date: string;
  targets: NutritionTargets;
  summary: NutritionSummary;
  logs: NutritionLog[];
};

export default function NutritionTrackerPage() {
  const { status } = useAuth();
  const t = useTranslations();
  const { fridges, status: fridgesStatus } = useFridges();
  const { dailyCache, setDailyData } = useNutritionStore();
  const [mounted, setMounted] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  
  const [data, setData] = useState<DailyNutritionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isTargetsOpen, setIsTargetsOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<NutritionLog | null>(null);
  const [submitting, setSubmitting] = useState(false);

  interface FridgeProduct {
    id: number;
    name: string;
    quantity?: number;
    unit?: string;
  }

  // Fridge products for selection
  const [fridgeProducts, setFridgeProducts] = useState<FridgeProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Form states - Log entry
  const [foodName, setFoodName] = useState("");
  const [mealType, setMealType] = useState("breakfast");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("serving");
  const [calories, setCalories] = useState("0");
  const [protein, setProtein] = useState("0");
  const [fat, setFat] = useState("0");
  const [carbs, setCarbs] = useState("0");

  // Form states - Targets
  const [targetCalories, setTargetCalories] = useState("2000");
  const [targetProtein, setTargetProtein] = useState("120");
  const [targetFat, setTargetFat] = useState("65");
  const [targetCarbs, setTargetCarbs] = useState("200");

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDailyData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await apiFetch<DailyNutritionResponse>(`/nutrition/daily?date=${selectedDate}`);
      setData(resp);
      setDailyData(selectedDate, resp as any);
      
      // Prefill targets form
      setTargetCalories(resp.targets.calories?.toString() ?? "2000");
      setTargetProtein(resp.targets.protein?.toString() ?? "120");
      setTargetFat(resp.targets.fat?.toString() ?? "65");
      setTargetCarbs(resp.targets.carbs?.toString() ?? "200");
    } catch (err) {
      toast.error(getErrorMessage(err, t("trackerLoadFailed")));
    } finally {
      setLoading(false);
    }
  }, [selectedDate, setDailyData, t]);

  useEffect(() => {
    if (status !== "authenticated" || !mounted) return;
    
    // Instantly load from cache to prevent blank screens/loaders
    const cached = dailyCache[selectedDate];
    if (cached) {
      setData(cached as any);
      setTargetCalories(cached.targets.calories?.toString() ?? "2000");
      setTargetProtein(cached.targets.protein?.toString() ?? "120");
      setTargetFat(cached.targets.fat?.toString() ?? "65");
      setTargetCarbs(cached.targets.carbs?.toString() ?? "200");
    } else {
      setData(null);
    }
    
    fetchDailyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, status, mounted, fetchDailyData]);

  // Keep local edits in sync with Zustand cache
  useEffect(() => {
    if (data && data.date === selectedDate) {
      setDailyData(selectedDate, data as any);
    }
  }, [data, selectedDate, setDailyData]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const fetchFridgeProducts = async () => {
    try {
      const items = await apiFetch<FridgeProduct[]>("/products");
      setFridgeProducts(items || []);
    } catch (err) {
      console.error("Failed to load products from fridge:", err);
    }
  };

  const handleOpenAddLog = () => {
    setEditingLog(null);
    setFoodName("");
    setMealType("breakfast");
    setQuantity("100");
    setUnit("g");
    setCalories("0");
    setProtein("0");
    setFat("0");
    setCarbs("0");
    setSelectedProductId(null);
    setIsLogOpen(true);
    fetchFridgeProducts();
  };

  const handleOpenEditLog = (log: NutritionLog) => {
    setEditingLog(log);
    setFoodName(log.foodName);
    setMealType(log.mealType);
    setQuantity(log.quantity?.toString() ?? "1");
    setUnit(log.unit ?? "serving");
    setCalories(log.calories.toString());
    setProtein(log.protein.toString());
    setFat(log.fat.toString());
    setCarbs(log.carbs.toString());
    setSelectedProductId(null);
    setIsLogOpen(true);
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        date: selectedDate,
        mealType,
        foodName: foodName.trim(),
        quantity: quantity ? Number(quantity) : null,
        unit: unit.trim() || null,
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        fat: Number(fat) || 0,
        carbs: Number(carbs) || 0,
        productId: selectedProductId,
      };

      if (editingLog) {
        const updated = await apiFetch<NutritionLog>(`/nutrition/log/${editingLog.id}`, {
          method: "PUT",
          body: payload,
        });
        toast.success(t("trackerUpdateSuccess"));
        // local update
        if (data) {
          setData({
            ...data,
            logs: data.logs.map((l) => (l.id === updated.id ? updated : l)),
          });
        }
      } else {
        const created = await apiFetch<NutritionLog>("/nutrition/log", {
          method: "POST",
          body: payload,
        });
        toast.success(t("trackerLogSuccess"));
        if (data) {
          setData({
            ...data,
            logs: [...data.logs, created],
          });
        }
      }
      setIsLogOpen(false);
      fetchDailyData(); // Refresh summary totals
    } catch (err) {
      toast.error(getErrorMessage(err, t("trackerLogFoodFailed")));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (!confirm(t("trackerDeleteConfirm"))) return;
    try {
      await apiFetch(`/nutrition/log/${id}`, { method: "DELETE" });
      toast.success(t("trackerDeleteSuccess"));
      if (data) {
        setData({
          ...data,
          logs: data.logs.filter((l) => l.id !== id),
        });
      }
      fetchDailyData(); // Refresh summary totals
    } catch (err) {
      toast.error(getErrorMessage(err, t("trackerDeleteFailed")));
    }
  };

  const handleTargetsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const resp = await apiFetch<NutritionTargets>("/nutrition/targets", {
        method: "POST",
        body: {
          calories: targetCalories ? Number(targetCalories) : null,
          protein: targetProtein ? Number(targetProtein) : null,
          fat: targetFat ? Number(targetFat) : null,
          carbs: targetCarbs ? Number(targetCarbs) : null,
        },
      });
      toast.success(t("trackerUpdateTargetsSuccess"));
      if (data) {
        setData({
          ...data,
          targets: resp,
        });
      }
      setIsTargetsOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, t("trackerUpdateTargetsFailed")));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || !mounted || (loading && !data)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate totals and limits
  const summary = data?.summary ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
  const targets = data?.targets ?? { calories: null, protein: null, fat: null, carbs: null };

  const calPercent = targets.calories ? Math.min(100, Math.round((summary.calories / targets.calories) * 100)) : 0;
  const protPercent = targets.protein ? Math.min(100, Math.round((summary.protein / targets.protein) * 100)) : 0;
  const fatPercent = targets.fat ? Math.min(100, Math.round((summary.fat / targets.fat) * 100)) : 0;
  const carbsPercent = targets.carbs ? Math.min(100, Math.round((summary.carbs / targets.carbs) * 100)) : 0;

  // Group logs
  const mealsOrder = ["breakfast", "lunch", "dinner", "snack"];
  const groupedLogs = mealsOrder.map((mType) => ({
    type: mType,
    items: data?.logs.filter((l) => l.mealType === mType) ?? [],
  }));

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
                  <Settings className="h-4 w-4" />
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
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest">
              <Activity className="h-3.5 w-3.5" />
              {t("trackerJournal")}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">{t("trackerTitle")}</h1>
            <p className="text-base md:text-lg text-muted-foreground font-medium">
              {t("trackerSubtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 shrink-0" onClick={() => setIsTargetsOpen(true)}>
              <Settings className="h-4.5 w-4.5 text-muted-foreground" />
            </Button>
            <Button onClick={handleOpenAddLog} className="rounded-xl font-bold h-10 shadow-sm shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> {t("trackerAddFood")}
            </Button>
          </div>
        </header>

        {/* Date Selector */}
        <div className="flex items-center justify-between bg-glass/20 border border-border/40 rounded-2xl p-3 max-w-sm mx-auto shadow-2xs">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={handlePrevDay}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 font-bold text-sm text-foreground/90">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{selectedDate === new Date().toISOString().split("T")[0] ? t("trackerToday") : selectedDate}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={handleNextDay}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Dashboard Rings & Goals */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Calories Large Ring Card */}
              <Card className="md:col-span-2 rounded-3xl border-border/60 bg-glass/25 shadow-xs overflow-hidden">
                <CardContent className="p-6 flex items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary">
                      <Flame className="h-4 w-4 text-primary" />
                      {t("trackerCalories")}
                    </div>
                    <div className="space-y-1">
                      <div className="text-4xl font-black tracking-tight text-foreground">
                        {summary.calories}
                        <span className="text-xs text-muted-foreground font-bold ml-1">{t("trackerKcal")}</span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">
                        {targets.calories ? t("trackerCaloriesGoal", { goal: targets.calories }) : t("trackerCaloriesGoalNotSet")}
                      </p>
                    </div>
                  </div>
                  {/* Circle progress bar */}
                  <div className="relative h-20 w-20 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-border/40"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-primary transition-all duration-500"
                        strokeWidth="3.5"
                        strokeDasharray={`${calPercent}, 100`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-foreground/90">
                      {calPercent}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Macros Mini Cards */}
              <div className="md:col-span-2 grid grid-cols-3 gap-3">
                {/* Protein */}
                <Card className="rounded-2xl border-border/60 bg-glass/25 p-4 flex flex-col justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{t("trackerProtein")}</div>
                  <div className="my-2">
                    <div className="text-lg font-black">{Math.round(summary.protein)}<span className="text-[10px] text-muted-foreground font-bold ml-0.5">{t("trackerGrams")}</span></div>
                    <div className="text-[10px] text-muted-foreground font-medium">{t("trackerGoalShort", { goal: targets.protein ?? "—" })}</div>
                  </div>
                  <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${protPercent}%` }} />
                  </div>
                </Card>

                {/* Fat */}
                <Card className="rounded-2xl border-border/60 bg-glass/25 p-4 flex flex-col justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">{t("trackerFat")}</div>
                  <div className="my-2">
                    <div className="text-lg font-black">{Math.round(summary.fat)}<span className="text-[10px] text-muted-foreground font-bold ml-0.5">{t("trackerGrams")}</span></div>
                    <div className="text-[10px] text-muted-foreground font-medium">{t("trackerGoalShort", { goal: targets.fat ?? "—" })}</div>
                  </div>
                  <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${fatPercent}%` }} />
                  </div>
                </Card>

                {/* Carbs */}
                <Card className="rounded-2xl border-border/60 bg-glass/25 p-4 flex flex-col justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">{t("trackerCarbsShort")}</div>
                  <div className="my-2">
                    <div className="text-lg font-black">{Math.round(summary.carbs)}<span className="text-[10px] text-muted-foreground font-bold ml-0.5">{t("trackerGrams")}</span></div>
                    <div className="text-[10px] text-muted-foreground font-medium">{t("trackerGoalShort", { goal: targets.carbs ?? "—" })}</div>
                  </div>
                  <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full transition-all" style={{ width: `${carbsPercent}%` }} />
                  </div>
                </Card>
              </div>

            </div>

            {/* Food Log Diary */}
            <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">
                {t("trackerDiary")}
              </h2>

              <div className="space-y-4">
                {groupedLogs.map((group) => {
                  const mealLabelMap: Record<string, string> = {
                    breakfast: t("trackerBreakfast"),
                    lunch: t("trackerLunch"),
                    dinner: t("trackerDinner"),
                    snack: t("trackerSnack"),
                  };
                  
                  const mealIconMap: Record<string, React.ReactNode> = {
                    breakfast: <Coffee className="h-4 w-4 text-primary shrink-0" />,
                    lunch: <Soup className="h-4 w-4 text-primary shrink-0" />,
                    dinner: <Salad className="h-4 w-4 text-primary shrink-0" />,
                    snack: <Cookie className="h-4 w-4 text-primary shrink-0" />,
                  };

                  const groupCalories = group.items.reduce((acc, i) => acc + i.calories, 0);

                  return (
                    <div key={group.type} className="space-y-2">
                      <div className="flex items-center justify-between px-2 py-1 border-b border-border/40">
                        <span className="text-sm font-bold text-foreground/90 inline-flex items-center gap-2">
                          {mealIconMap[group.type]}
                          {mealLabelMap[group.type]}
                        </span>
                        {group.items.length > 0 && (
                          <span className="text-xs font-black text-primary">{groupCalories} {t("trackerKcal")}</span>
                        )}
                      </div>

                      {group.items.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60 italic pl-8 py-2">{t("trackerNoEntries")}</p>
                      ) : (
                        <div className="rounded-2xl border border-border/60 bg-glass/10 overflow-hidden divide-y divide-border/60 shadow-2xs">
                          {group.items.map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-4 gap-4 bg-card/25 hover:bg-secondary/10 transition-all">
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-sm text-foreground/90 truncate">{log.foodName}</p>
                                <p className="text-[10px] text-muted-foreground/80 font-medium mt-0.5">
                                  {log.quantity} {log.unit ?? "serving"} · {t("trackerProtein")[0]}: {Math.round(log.protein)}{t("trackerGrams")} · {t("trackerFat")[0]}: {Math.round(log.fat)}{t("trackerGrams")} · {t("trackerCarbs")[0]}: {Math.round(log.carbs)}{t("trackerGrams")}
                                </p>
                              </div>
                              
                              <div className="shrink-0 text-right">
                                <span className="font-black text-sm text-foreground">{log.calories} {t("trackerKcal")}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                                  onClick={() => handleOpenEditLog(log)}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteLog(log.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>

      {/* Log Food Dialog */}
      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight">
              {editingLog ? t("trackerEditEntry") : t("trackerLogFood")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t("trackerLogFoodDesc")}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleLogSubmit} className="space-y-4 pt-2">
            {!editingLog && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
                  <Refrigerator className="h-3.5 w-3.5 text-primary" />
                  {t("trackerSelectFromFridge")}
                </Label>
                <Select
                  value={selectedProductId?.toString() ?? "none"}
                  onValueChange={(val) => {
                    if (val === "none") {
                      setSelectedProductId(null);
                    } else {
                      const pid = Number(val);
                      setSelectedProductId(pid);
                      const prod = fridgeProducts.find((p) => p.id === pid);
                      if (prod) {
                        setFoodName(prod.name);
                        setUnit(prod.unit || "g");
                        setQuantity(prod.quantity?.toString() ?? "100");
                      }
                    }
                  }}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder={t("trackerSelectFromFridgePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("trackerSelectFromFridgePlaceholder")}</SelectItem>
                    {fridgeProducts.map((prod) => (
                      <SelectItem key={prod.id} value={prod.id.toString()}>
                        {prod.name} ({prod.quantity} {prod.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("trackerFoodName")}</Label>
              <Input
                placeholder={t("trackerFoodNamePlaceholder")}
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("trackerMealType")}</Label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">{t("trackerBreakfast")}</SelectItem>
                    <SelectItem value="lunch">{t("trackerLunch")}</SelectItem>
                    <SelectItem value="dinner">{t("trackerDinner")}</SelectItem>
                    <SelectItem value="snack">{t("trackerSnack")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("trackerQty")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("trackerUnit")}</Label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {selectedProductId && (
              <div className="text-xs font-semibold text-amber-500 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 animate-in fade-in slide-in-from-top-1">
                ⚠️ {t("trackerWillDecrementFridge", { qty: quantity, unit: unit })}
              </div>
            )}

            <div className="border-t border-border/40 my-2 pt-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-primary mb-3">
                {t("trackerNutritionalValue")}
              </h4>
              
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground">{t("trackerKcal")}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="h-10 rounded-lg text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-emerald-600">{t("trackerProteinLabel")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="h-10 rounded-lg text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-amber-600">{t("trackerFatLabel")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    className="h-10 rounded-lg text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-cyan-600">{t("trackerCarbsLabel")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="h-10 rounded-lg text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button type="button" variant="ghost" onClick={() => setIsLogOpen(false)} className="rounded-xl">
                {t("actionCancel")}
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl font-bold shadow-xs">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("actionSave")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Targets Config Dialog */}
      <Dialog open={isTargetsOpen} onOpenChange={setIsTargetsOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight">
              {t("trackerDailyGoals")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t("trackerDailyGoalsDesc")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTargetsSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-primary">{t("trackerDailyCaloriesGoal")}</Label>
              <Input
                type="number"
                min="0"
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                required
                className="h-11 rounded-xl font-black text-lg"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-emerald-600">{t("trackerProteinLabel")}</Label>
                <Input
                  type="number"
                  min="0"
                  value={targetProtein}
                  onChange={(e) => setTargetProtein(e.target.value)}
                  className="h-11 rounded-xl text-center"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-amber-600">{t("trackerFatLabel")}</Label>
                <Input
                  type="number"
                  min="0"
                  value={targetFat}
                  onChange={(e) => setTargetFat(e.target.value)}
                  className="h-11 rounded-xl text-center"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-cyan-600">{t("trackerCarbsLabel")}</Label>
                <Input
                  type="number"
                  min="0"
                  value={targetCarbs}
                  onChange={(e) => setTargetCarbs(e.target.value)}
                  className="h-11 rounded-xl text-center"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button type="button" variant="ghost" onClick={() => setIsTargetsOpen(false)} className="rounded-xl">
                {t("actionCancel")}
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl font-bold shadow-xs">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("actionSave")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}



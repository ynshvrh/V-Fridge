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
} from "lucide-react";

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

  const fetchDailyData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await apiFetch<DailyNutritionResponse>(`/nutrition/daily?date=${selectedDate}`);
      setData(resp);
      
      // Prefill targets form
      setTargetCalories(resp.targets.calories?.toString() ?? "2000");
      setTargetProtein(resp.targets.protein?.toString() ?? "120");
      setTargetFat(resp.targets.fat?.toString() ?? "65");
      setTargetCarbs(resp.targets.carbs?.toString() ?? "200");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load nutrition log."));
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchDailyData();
  }, [selectedDate, status, fetchDailyData]);

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

  const handleOpenAddLog = () => {
    setEditingLog(null);
    setFoodName("");
    setMealType("breakfast");
    setQuantity("1");
    setUnit("serving");
    setCalories("0");
    setProtein("0");
    setFat("0");
    setCarbs("0");
    setIsLogOpen(true);
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
      };

      if (editingLog) {
        const updated = await apiFetch<NutritionLog>(`/nutrition/log/${editingLog.id}`, {
          method: "PUT",
          body: payload,
        });
        toast.success("Entry updated.");
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
        toast.success("Food logged successfully.");
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
      toast.error(getErrorMessage(err, "Failed to log food."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (!confirm("Are you sure you want to delete this food entry?")) return;
    try {
      await apiFetch(`/nutrition/log/${id}`, { method: "DELETE" });
      toast.success("Entry deleted.");
      if (data) {
        setData({
          ...data,
          logs: data.logs.filter((l) => l.id !== id),
        });
      }
      fetchDailyData(); // Refresh summary totals
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete food entry."));
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
      toast.success("Nutrition targets updated.");
      if (data) {
        setData({
          ...data,
          targets: resp,
        });
      }
      setIsTargetsOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update targets."));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
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

  return (
    <div className="min-h-full w-full p-4 md:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest">
              <Activity className="h-3.5 w-3.5" />
              Журнал харчування
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Трекер калорій</h1>
            <p className="text-base md:text-lg text-muted-foreground font-medium">
              Керуйте щоденними цілями, рахуйте калорії та БЖВ страв
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 shrink-0" onClick={() => setIsTargetsOpen(true)}>
              <Settings className="h-4.5 w-4.5 text-muted-foreground" />
            </Button>
            <Button onClick={handleOpenAddLog} className="rounded-xl font-bold h-10 shadow-sm shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Додати їжу
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
            <span>{selectedDate === new Date().toISOString().split("T")[0] ? "Сьогодні" : selectedDate}</span>
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
                      Калорії
                    </div>
                    <div className="space-y-1">
                      <div className="text-4xl font-black tracking-tight text-foreground">
                        {summary.calories}
                        <span className="text-xs text-muted-foreground font-bold ml-1">кКал</span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">
                        ціль: {targets.calories ?? "не встановлено"} кКал
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
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Білки</div>
                  <div className="my-2">
                    <div className="text-lg font-black">{Math.round(summary.protein)}<span className="text-[10px] text-muted-foreground font-bold ml-0.5">г</span></div>
                    <div className="text-[10px] text-muted-foreground font-medium">ціль: {targets.protein ?? "—"}г</div>
                  </div>
                  <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${protPercent}%` }} />
                  </div>
                </Card>

                {/* Fat */}
                <Card className="rounded-2xl border-border/60 bg-glass/25 p-4 flex flex-col justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Жири</div>
                  <div className="my-2">
                    <div className="text-lg font-black">{Math.round(summary.fat)}<span className="text-[10px] text-muted-foreground font-bold ml-0.5">г</span></div>
                    <div className="text-[10px] text-muted-foreground font-medium">ціль: {targets.fat ?? "—"}г</div>
                  </div>
                  <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${fatPercent}%` }} />
                  </div>
                </Card>

                {/* Carbs */}
                <Card className="rounded-2xl border-border/60 bg-glass/25 p-4 flex flex-col justify-between">
                  <div className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Вугл.</div>
                  <div className="my-2">
                    <div className="text-lg font-black">{Math.round(summary.carbs)}<span className="text-[10px] text-muted-foreground font-bold ml-0.5">г</span></div>
                    <div className="text-[10px] text-muted-foreground font-medium">ціль: {targets.carbs ?? "—"}г</div>
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
                Щоденник їжі
              </h2>

              <div className="space-y-4">
                {groupedLogs.map((group) => {
                  const mealLabelMap: Record<string, string> = {
                    breakfast: "Сніданок",
                    lunch: "Обід",
                    dinner: "Вечеря",
                    snack: "Перекус",
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
                          <span className="text-xs font-black text-primary">{groupCalories} кКал</span>
                        )}
                      </div>

                      {group.items.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60 italic pl-8 py-2">Записи відсутні</p>
                      ) : (
                        <div className="rounded-2xl border border-border/60 bg-glass/10 overflow-hidden divide-y divide-border/60 shadow-2xs">
                          {group.items.map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-4 gap-4 bg-card/25 hover:bg-secondary/10 transition-all">
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-sm text-foreground/90 truncate">{log.foodName}</p>
                                <p className="text-[10px] text-muted-foreground/80 font-medium mt-0.5">
                                  {log.quantity} {log.unit ?? "serving"} · B: {Math.round(log.protein)}г · Ж: {Math.round(log.fat)}г · В: {Math.round(log.carbs)}г
                                </p>
                              </div>
                              
                              <div className="shrink-0 text-right">
                                <span className="font-black text-sm text-foreground">{log.calories} кКал</span>
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
              {editingLog ? "Редагувати запис" : "Записати страву"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Введіть деталі страви та її харчову цінність.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleLogSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Назва страви / продукту</Label>
              <Input
                placeholder="напр., Грецький салат"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Прийом їжі</Label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Сніданок</SelectItem>
                    <SelectItem value="lunch">Обід</SelectItem>
                    <SelectItem value="dinner">Вечеря</SelectItem>
                    <SelectItem value="snack">Перекус</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">К-сть</Label>
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
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Од.</Label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border/40 my-2 pt-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-primary mb-3">
                Харчова цінність (калорії та БЖВ)
              </h4>
              
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground">кКал</Label>
                  <Input
                    type="number"
                    min="0"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="h-10 rounded-lg text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-emerald-600">Білки (г)</Label>
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
                  <Label className="text-[10px] font-bold text-amber-600">Жири (г)</Label>
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
                  <Label className="text-[10px] font-bold text-cyan-600">Вугл. (г)</Label>
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
                Скасувати
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl font-bold shadow-xs">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Зберегти
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
              Добові цілі харчування
            </DialogTitle>
            <DialogDescription className="text-xs">
              Встановіть бажану норму калорій та БЖВ на день.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTargetsSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-primary">Добова калорійність (кКал)</Label>
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
                <Label className="text-xs font-bold uppercase tracking-wider text-emerald-600">Білки (г)</Label>
                <Input
                  type="number"
                  min="0"
                  value={targetProtein}
                  onChange={(e) => setTargetProtein(e.target.value)}
                  className="h-11 rounded-xl text-center"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-amber-600">Жири (г)</Label>
                <Input
                  type="number"
                  min="0"
                  value={targetFat}
                  onChange={(e) => setTargetFat(e.target.value)}
                  className="h-11 rounded-xl text-center"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-cyan-600">Вуглеводи (г)</Label>
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
                Скасувати
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl font-bold shadow-xs">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Зберегти
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}



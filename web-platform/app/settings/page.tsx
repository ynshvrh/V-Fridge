"use client";
import { useState, useMemo, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/providers/auth-provider";
import { apiFetch } from "@/lib/api-client";
import {
  Trash2,
  LogOut,
  ShieldCheck,
  User,
  MailCheck,
  MailWarning,
  Palette,
  Languages,
  ChefHat,
  Loader2,
  Sparkles,
  Check,
  Refrigerator,
  UtensilsCrossed,
  CalendarDays,
  ShoppingBasket,
  Flame,
  Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { FridgesCard } from "@/components/fridges-card";
import { SUPPORTED_LOCALES, switchLocale, type Locale } from "@/lib/locale";
import { CUISINE_SLUGS, cuisineLabelKey } from "@/interfaces/cuisines";
import { usePreferencesStore } from "@/store/usePreferencesStore";

export default function Settings() {
  const t = useTranslations();
  const activeLocale = useLocale() as Locale;
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "fridges" | "interface" | "danger">("profile");

  const clearData = async (type: "chat" | "products") => {
    const confirmKey = type === "chat" ? "settingsDeleteChatConfirm" : "settingsClearProductsConfirm";
    if (!confirm(t(confirmKey))) return;

    try {
      await apiFetch(`/${type}`, { method: "DELETE" });
      toast.success(t(type === "chat" ? "settingsChatCleared" : "settingsFridgeCleared"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("settingsPreferencesFailed")));
    }
  };

  const resendVerification = async () => {
    if (!user?.email) return;
    try {
      await apiFetch("/auth/resend-verification", {
        method: "POST",
        body: { email: user.email },
        skipAuth: true,
      });
      toast.success(t("signinResendSent"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("settingsPreferencesFailed")));
    }
  };

  const tabItems = [
    { id: "profile", label: "Профіль", icon: User },
    { id: "preferences", label: "Смаки та уподобання", icon: ChefHat },
    { id: "fridges", label: "Спільні холодильники", icon: Refrigerator },
    { id: "interface", label: "Налаштування інтерфейсу", icon: Palette },
    { id: "danger", label: "Безпека та дані", icon: Trash2 },
  ] as const;

  return (
    <div className="min-h-full w-full p-4 md:p-8 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest">
            <SettingsIcon className="h-3 w-3" />
            {t("settingsTitle")}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{t("settingsTitle")}</h1>
          <p className="text-base md:text-lg text-muted-foreground font-medium">
            {t("settingsHeroSubtitle")}
          </p>
        </header>

        <Separator className="bg-border/60" />

        {/* Mobile Horizontal Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 md:hidden no-scrollbar">
          {tabItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Desktop Vertical Sidebar Tabs */}
          <aside className="hidden md:block md:col-span-4 space-y-4">
            <Card className="rounded-3xl bg-glass border border-border/60 shadow-sm overflow-hidden p-3 space-y-1">
              {tabItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </Card>

            {/* Sticky user badge info in sidebar */}
            <div className="p-5 rounded-3xl bg-glass border border-border/60 shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-brand-gradient text-primary-foreground grid place-items-center text-sm font-black shrink-0">
                {(user?.username || user?.email || "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{user?.username || "Guest"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email || "—"}</p>
              </div>
            </div>
          </aside>

          {/* Active Tab Panel Content */}
          <main className="md:col-span-8 space-y-5">
            {activeTab === "profile" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Profile Detail Card */}
                <Card className="rounded-3xl bg-glass overflow-hidden shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/30">
                    <CardTitle className="text-lg inline-flex items-center gap-2 font-black tracking-tight">
                      <User className="h-4 w-4 text-primary" />
                      Ваш Профіль
                    </CardTitle>
                    <CardDescription>Основна інформація про ваш акаунт.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-secondary/15 border border-border/30">
                      <div className="h-16 w-16 rounded-2xl bg-brand-gradient text-primary-foreground grid place-items-center shadow-md text-xl font-black">
                        {(user?.username || user?.email || "?").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="space-y-1 text-center sm:text-left">
                        <h4 className="font-black text-lg tracking-tight">{user?.username || "Guest"}</h4>
                        <p className="text-xs text-muted-foreground">{user?.email || "—"}</p>
                      </div>
                      <div className="sm:ml-auto">
                        {user?.emailVerified ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/15 text-success text-[10px] font-bold uppercase tracking-widest">
                            <MailCheck className="h-3 w-3" />
                            {t("settingsEmailVerified")}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={resendVerification}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-solara/20 text-foreground dark:bg-solara/15 text-[10px] font-bold uppercase tracking-widest hover:bg-solara/30 transition-colors"
                          >
                            <MailWarning className="h-3 w-3 text-solara" />
                            {t("settingsEmailNotVerified")}
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Cuisine Preference Card */}
                <CuisineCard
                  currentSlug={user?.cuisinePreference ?? "any"}
                  onSaved={refreshUser}
                />

                {/* Dietary Profile Card */}
                <DietaryProfileCard
                  currentProfile={user?.dietaryProfile ?? ""}
                  onSaved={refreshUser}
                />
              </div>
            )}

            {activeTab === "fridges" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <FridgesCard />
              </div>
            )}

            {activeTab === "interface" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Appearance Theme Card */}
                <Card className="rounded-3xl bg-glass overflow-hidden shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/30">
                    <CardTitle className="text-lg inline-flex items-center gap-2 font-black tracking-tight">
                      <Palette className="h-4 w-4 text-primary" />
                      {t("settingsAppearance")}
                    </CardTitle>
                    <CardDescription>{t("settingsAppearanceHint")}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-muted-foreground">{t("settingsThemeLabel")}</span>
                    <ThemeToggle />
                  </CardContent>
                </Card>

                {/* Quick Actions Preferences Customizer */}
                <QuickActionsCustomizer />

                {/* Language Settings Card */}
                <LanguageCard activeLocale={activeLocale} />
              </div>
            )}

            {activeTab === "danger" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Danger Actions Card */}
                <Card className="rounded-3xl border-destructive/25 shadow-sm bg-destructive/5 overflow-hidden">
                  <CardHeader className="border-b border-destructive/15 pb-4">
                    <CardTitle className="text-lg text-destructive font-black tracking-tight">{t("settingsDangerZone")}</CardTitle>
                    <CardDescription className="text-destructive/80 font-medium">{t("settingsCannotBeUndone")}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5 flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 text-destructive border-destructive/30 hover:bg-destructive hover:text-white rounded-xl font-bold transition-colors"
                      onClick={() => clearData("products")}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("settingsClearProducts")}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-12 text-destructive border-destructive/30 hover:bg-destructive hover:text-white rounded-xl font-bold transition-colors"
                      onClick={() => clearData("chat")}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("settingsDeleteChat")}
                    </Button>
                  </CardContent>
                </Card>

                {/* Account Sign Out Card */}
                <Card className="rounded-3xl border-border/30 bg-glass/40 shadow-sm">
                  <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-success/15 text-success">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-black text-sm tracking-tight">
                          {user?.username || "Guest"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email || "—"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full sm:w-auto px-6 h-11 font-bold rounded-xl shadow-md shadow-destructive/10"
                      onClick={logout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("settingsSignOut")}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function LanguageCard({ activeLocale }: { activeLocale: Locale }) {
  const t = useTranslations();
  const [busy, setBusy] = useState<Locale | null>(null);

  const pick = async (locale: Locale) => {
    if (locale === activeLocale || busy) return;
    setBusy(locale);
    try {
      await switchLocale(locale);
    } catch (err) {
      setBusy(null);
      toast.error(getErrorMessage(err, t("settingsPreferencesFailed")));
    }
  };

  return (
    <Card className="rounded-3xl bg-glass overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-lg inline-flex items-center gap-2 font-black tracking-tight">
          <Languages className="h-4 w-4 text-primary" />
          {t("settingsLanguage")}
        </CardTitle>
        <CardDescription>{t("settingsLanguageHint")}</CardDescription>
      </CardHeader>
      <CardContent className="pt-5 flex flex-col sm:flex-row gap-2">
        {SUPPORTED_LOCALES.map((loc) => {
          const labelKey = loc === "en" ? "settingsLanguageEnglish" : "settingsLanguageUkrainian";
          const isActive = loc === activeLocale;
          return (
            <Button
              key={loc}
              variant={isActive ? "default" : "outline"}
              disabled={busy !== null}
              onClick={() => pick(loc)}
              className="flex-1 h-11 rounded-xl gap-2 font-bold"
            >
              {busy === loc && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(labelKey)}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}

function CuisineCard({
  currentSlug,
  onSaved,
}: {
  currentSlug: string;
  onSaved: () => Promise<void>;
}) {
  const t = useTranslations();
  const [saving, setSaving] = useState(false);

  const save = async (slug: string) => {
    if (slug === currentSlug || saving) return;
    setSaving(true);
    try {
      await apiFetch("/auth/me/preferences", {
        method: "PATCH",
        body: { cuisinePreference: slug },
      });
      await onSaved();
      toast.success(t("settingsCuisineSaved"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("settingsPreferencesFailed")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-3xl bg-glass overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-lg inline-flex items-center gap-2 font-black tracking-tight">
          <ChefHat className="h-4 w-4 text-primary" />
          {t("settingsCuisine")}
        </CardTitle>
        <CardDescription>{t("settingsCuisineHint")}</CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <Select value={currentSlug} disabled={saving} onValueChange={save}>
          <SelectTrigger className="w-full h-11 rounded-xl font-semibold">
            <SelectValue />
            {saving && <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />}
          </SelectTrigger>
          <SelectContent>
            {CUISINE_SLUGS.map((slug) => (
              <SelectItem key={slug} value={slug}>
                {t(cuisineLabelKey(slug))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

function DietaryProfileCard({
  currentProfile,
  onSaved,
}: {
  currentProfile: string;
  onSaved: () => Promise<void>;
}) {
  const t = useTranslations();
  
  // Parse initial values from serialized string
  const initial = useMemo(() => {
    let complexity: "easy" | "normal" | "gourmet" = "normal";
    const excluded: string[] = [];
    let additional = "";

    if (currentProfile) {
      const complexityMatch = currentProfile.match(/Складність:\s*(легкі|звичайні|складні)/i);
      const excludedMatch = currentProfile.match(/Не їм:\s*([^.\n]+)/i);

      if (complexityMatch) {
        const val = complexityMatch[1].toLowerCase();
        if (val === "легкі") complexity = "easy";
        else if (val === "складні") complexity = "gourmet";
        else complexity = "normal";
      }

      if (excludedMatch) {
        const items = excludedMatch[1].split(",").map(i => i.trim()).filter(Boolean);
        excluded.push(...items);
      }

      const additionalMatch = currentProfile.match(/Додатково:\s*([\s\S]*)/i);
      if (additionalMatch) {
        additional = additionalMatch[1].trim();
      } else if (!complexityMatch && !excludedMatch) {
        additional = currentProfile.trim();
      }
    }
    return { complexity, excluded, additional };
  }, [currentProfile]);

  const [complexity, setComplexity] = useState<"easy" | "normal" | "gourmet">(initial.complexity);
  const [excluded, setExcluded] = useState<string[]>(initial.excluded);
  const [additional, setAdditional] = useState(initial.additional);
  const [saving, setSaving] = useState(false);

  // Sync state if initial changes (e.g. after refreshUser)
  useEffect(() => {
    setComplexity(initial.complexity);
    setExcluded(initial.excluded);
    setAdditional(initial.additional);
  }, [initial]);

  const EXCLUDED_PRESETS = [
    { label: "🐟 Риба", val: "Риба" },
    { label: "🐖 Свинина", val: "Свинина" },
    { label: "🥩 Яловичина", val: "Яловичина" },
    { label: "🍄 Гриби", val: "Гриби" },
    { label: "🥛 Лактоза", val: "Лактоза" },
    { label: "🥜 Горіхи", val: "Горіхи" },
    { label: "🥚 Яйця", val: "Яйця" },
    { label: "🐔 Птиця", val: "Птиця" },
    { label: "🧅 Цибуля", val: "Цибуля" },
    { label: "🧄 Часник", val: "Часник" },
  ];

  const handleToggleExclude = (val: string) => {
    setExcluded(prev =>
      prev.includes(val) ? prev.filter(item => item !== val) : [...prev, val]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Construct serialized profile string
    const complexityLabel = complexity === "easy" ? "легкі" : complexity === "gourmet" ? "складні" : "звичайні";
    let serialized = `Складність: ${complexityLabel}.`;
    if (excluded.length > 0) {
      serialized += ` Не їм: ${excluded.join(", ")}.`;
    }
    if (additional.trim()) {
      serialized += ` Додатково: ${additional.trim()}`;
    }

    try {
      await apiFetch("/auth/me/preferences", {
        method: "PATCH",
        body: { dietaryProfile: serialized },
      });
      await onSaved();
      toast.success(t("settingsDietarySaved"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("settingsPreferencesFailed")));
    } finally {
      setSaving(false);
    }
  };

  // Compare if current local inputs are different from cached database values
  const hasChanges = useMemo(() => {
    const isComplexityDiff = complexity !== initial.complexity;
    const isAdditionalDiff = additional.trim() !== initial.additional.trim();
    const isExcludedDiff =
      excluded.length !== initial.excluded.length ||
      !excluded.every(item => initial.excluded.includes(item));
    return isComplexityDiff || isAdditionalDiff || isExcludedDiff;
  }, [complexity, excluded, additional, initial]);

  return (
    <Card className="rounded-3xl bg-glass overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-lg inline-flex items-center gap-2 font-black tracking-tight">
          <Sparkles className="h-4 w-4 text-primary" />
          Харчові уподобання та дієтичний профіль
        </CardTitle>
        <CardDescription>Налаштуйте складність рецептів та продукти, які ви не їсте. ШІ-шеф автоматично враховуватиме це при складанні планів.</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-5 space-y-6">
        {/* Recipe Complexity Section */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
            Складність рецептів у планувальнику
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "easy", label: "🟢 Легкі страви", desc: "Швидко й просто" },
              { id: "normal", label: "🟡 Звичайні страви", desc: "Збалансовані" },
              { id: "gourmet", label: "🔴 Складні страви", desc: "Вишукані / Довгі" }
            ].map(c => {
              const active = complexity === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setComplexity(c.id as any)}
                  className={`flex-1 min-w-[130px] flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    active
                      ? "bg-primary/10 border-primary text-foreground font-bold shadow-xs"
                      : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-sm font-bold">{c.label}</span>
                  <span className="text-[10px] text-muted-foreground/80 font-normal mt-0.5">{c.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Excluded Products Section */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
            Які продукти ви НЕ їсте? (Шеф виключить їх)
          </label>
          <div className="flex flex-wrap gap-2">
            {EXCLUDED_PRESETS.map((p) => {
              const active = excluded.includes(p.val);
              return (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => handleToggleExclude(p.val)}
                  className={`text-xs px-3.5 py-2.5 rounded-xl border transition-all font-bold cursor-pointer ${
                    active
                      ? "bg-destructive/10 border-destructive text-destructive font-extrabold shadow-2xs"
                      : "bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Area for Additional Wishes */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
            Додаткові побажання чи улюблені страви
          </label>
          <textarea
            value={additional}
            onChange={(e) => setAdditional(e.target.value)}
            placeholder="Наприклад: 'Люблю макарони з сиром', 'Не їм гостру їжу', 'Маю алергію на морепродукти'..."
            className="w-full min-h-[100px] rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            maxLength={1000}
          />
        </div>

        {/* Action Save Button */}
        <div className="flex justify-end pt-2 border-t border-border/40">
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="rounded-xl font-bold h-10 px-6 gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("actionSave")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionsCustomizer() {
  const t = useTranslations();
  const { quickActions, setQuickActions } = usePreferencesStore();

  const options = [
    { key: "fridge", title: t("dashboardQuickFridgeTitle"), icon: Refrigerator },
    { key: "recipe", title: t("dashboardQuickChefTitle"), icon: UtensilsCrossed },
    { key: "planner", title: t("dashboardQuickPlannerTitle"), icon: CalendarDays },
    { key: "shopping", title: t("dashboardQuickShoppingTitle"), icon: ShoppingBasket },
    { key: "nutrition", title: t("dashboardQuickNutritionTitle"), icon: Flame },
    { key: "settings", title: t("dashboardQuickSettingsTitle"), icon: SettingsIcon },
  ];

  const toggle = (key: string) => {
    if (quickActions.includes(key)) {
      if (quickActions.length <= 1) {
        toast.warning("Оберіть хоча б одну швидку дію");
        return;
      }
      setQuickActions(quickActions.filter((k) => k !== key));
    } else {
      setQuickActions([...quickActions, key]);
    }
  };

  return (
    <Card className="rounded-3xl bg-glass overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-lg inline-flex items-center gap-2 font-black tracking-tight">
          <Sparkles className="h-4 w-4 text-primary" />
          Налаштування швидких дій
        </CardTitle>
        <CardDescription>
          Оберіть, які розділи показувати на головній сторінці як швидкі дії.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((opt) => {
            const isChecked = quickActions.includes(opt.key);
            const Icon = opt.icon;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggle(opt.key)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-all text-left text-xs cursor-pointer select-none"
              >
                <div className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isChecked ? "bg-success border-success text-white" : "border-border/80"}`}>
                  {isChecked && <Check className="h-3 w-3" />}
                </div>
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <span className="font-bold text-foreground">
                  {opt.title}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

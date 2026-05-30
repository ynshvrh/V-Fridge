"use client";
import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { FridgesCard } from "@/components/fridges-card";
import { SUPPORTED_LOCALES, switchLocale, type Locale } from "@/lib/locale";
import { CUISINE_SLUGS, cuisineLabelKey } from "@/interfaces/cuisines";

export default function Settings() {
  const t = useTranslations();
  const activeLocale = useLocale() as Locale;
  const { user, logout, refreshUser } = useAuth();

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

  return (
    <div className="min-h-full w-full p-4 md:p-8 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest">
            <User className="h-3 w-3" />
            {t("settingsProfile")}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{t("settingsTitle")}</h1>
          <p className="text-base md:text-lg text-muted-foreground font-medium">
            {t("settingsHeroSubtitle")}
          </p>
        </header>

        <Separator className="bg-border/60" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <section className="md:col-span-4 space-y-4">
            <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-md shadow-primary/20 text-2xl font-black">
                {(user?.username || user?.email || "?").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h3 className="font-black text-xl tracking-tight">
                  {user?.username || "Guest"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {user?.email || "—"}
                </p>
              </div>
              {user?.emailVerified ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 text-success text-[10px] font-bold uppercase tracking-widest">
                  <MailCheck className="h-3 w-3" />
                  {t("settingsEmailVerified")}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={resendVerification}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100 text-[11px] font-bold uppercase tracking-widest hover:bg-yellow-200 transition-colors"
                >
                  <MailWarning className="h-3.5 w-3.5" />
                  {t("settingsEmailNotVerified")}
                </button>
              )}
            </div>
          </section>

          <main className="md:col-span-8 space-y-5">
            <FridgesCard />

            <Card className="rounded-3xl border-border/60 shadow-sm bg-card overflow-hidden">
              <CardHeader className="bg-muted/40 pb-4">
                <CardTitle className="text-lg inline-flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  {t("settingsAppearance")}
                </CardTitle>
                <CardDescription>{t("settingsAppearanceHint")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-muted-foreground">{t("settingsThemeLabel")}</span>
                <ThemeToggle />
              </CardContent>
            </Card>

            <LanguageCard activeLocale={activeLocale} />
            <CuisineCard
              currentSlug={user?.cuisinePreference ?? "any"}
              onSaved={refreshUser}
            />

            <Card className="rounded-3xl border-destructive/20 shadow-sm overflow-hidden">
              <CardHeader className="bg-destructive/5 border-b border-destructive/10 pb-4">
                <CardTitle className="text-lg text-destructive">{t("settingsDangerZone")}</CardTitle>
                <CardDescription>{t("settingsCannotBeUndone")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 text-destructive border-destructive/30 hover:bg-destructive hover:text-white rounded-xl"
                  onClick={() => clearData("products")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("settingsClearProducts")}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-12 text-destructive border-destructive/30 hover:bg-destructive hover:text-white rounded-xl"
                  onClick={() => clearData("chat")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("settingsDeleteChat")}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/60 shadow-sm bg-secondary/30">
              <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-success/15">
                    <ShieldCheck className="h-5 w-5 text-success" />
                  </div>
                  <p className="font-semibold text-sm">
                    {user?.username || user?.email}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto px-6 h-11 font-bold rounded-xl shadow-md shadow-destructive/20"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("settingsSignOut")}
                </Button>
              </CardContent>
            </Card>
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
      // switchLocale forces a reload; control never returns here. Setting
      // busy state is mostly belt-and-braces in case the navigation stalls.
    } catch (err) {
      setBusy(null);
      toast.error(getErrorMessage(err, t("settingsPreferencesFailed")));
    }
  };

  return (
    <Card className="rounded-3xl border-border/60 shadow-sm bg-card overflow-hidden">
      <CardHeader className="bg-muted/40 pb-4">
        <CardTitle className="text-lg inline-flex items-center gap-2">
          <Languages className="h-4 w-4" />
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
    <Card className="rounded-3xl border-border/60 shadow-sm bg-card overflow-hidden">
      <CardHeader className="bg-muted/40 pb-4">
        <CardTitle className="text-lg inline-flex items-center gap-2">
          <ChefHat className="h-4 w-4" />
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

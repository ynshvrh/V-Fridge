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
            <div className="p-6 rounded-3xl bg-glass shadow-lg flex flex-col items-center text-center space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -z-10" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-mistral/10 rounded-full blur-2xl -z-10" />
              <div className="h-20 w-20 rounded-2xl bg-brand-gradient text-primary-foreground grid place-items-center shadow-lg shadow-primary/10 text-2xl font-black transition-transform hover:scale-105">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-solara/20 text-foreground dark:bg-solara/15 text-[11px] font-bold uppercase tracking-widest hover:bg-solara/30 transition-colors"
                >
                  <MailWarning className="h-3.5 w-3.5 text-solara" />
                  {t("settingsEmailNotVerified")}
                </button>
              )}
            </div>
          </section>

          <main className="md:col-span-8 space-y-5">
            <FridgesCard />

            <Card className="rounded-3xl bg-glass overflow-hidden">
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

            <LanguageCard activeLocale={activeLocale} />
            <CuisineCard
              currentSlug={user?.cuisinePreference ?? "any"}
              onSaved={refreshUser}
            />

            <Card className="rounded-3xl border-destructive/25 shadow-sm bg-destructive/5 overflow-hidden">
              <CardHeader className="border-b border-destructive/15 pb-4">
                <CardTitle className="text-lg text-destructive font-black tracking-tight">{t("settingsDangerZone")}</CardTitle>
                <CardDescription className="text-destructive/80 font-medium">{t("settingsCannotBeUndone")}</CardDescription>
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
    <Card className="rounded-3xl bg-glass overflow-hidden">
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
    <Card className="rounded-3xl bg-glass overflow-hidden">
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

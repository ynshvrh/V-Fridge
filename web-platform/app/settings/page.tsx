"use client";
import { useState, useMemo, useEffect, useRef } from "react";
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
import { useAuth, type AuthUser } from "@/providers/auth-provider";
import { apiFetch, API_BASE } from "@/lib/api-client";
import {
  Trash2,
  LogOut,
  ShieldCheck,
  User,
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
  Plus,
  Settings as SettingsIcon,
  Pizza,
  Coffee,
  Apple,
  Heart,
  Star,
  Zap,
  Crown,
  Trophy,
  Shield,
  Smile,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/providers/theme-provider";

// Icon avatar mapping
const AVATAR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  user: User,
  chefHat: ChefHat,
  pizza: Pizza,
  coffee: Coffee,
  apple: Apple,
  heart: Heart,
  star: Star,
  zap: Zap,
  crown: Crown,
  trophy: Trophy,
  shield: Shield,
  smile: Smile,
  gift: Gift,
  flame: Flame,
  refrigerator: Refrigerator,
};

const renderAvatar = (avatar: string | null | undefined, initial: string, iconClassName = "h-5 w-5") => {
  if (!avatar) {
    return <span>{initial}</span>;
  }

  // If it's a URL or base64 (if the user still has one, or for legacy)
  if (avatar.startsWith("/") || avatar.startsWith("http")) {
    return (
      <img
        src={avatar.startsWith("/") ? `${API_BASE}${avatar}` : avatar}
        alt="Avatar"
        className="h-full w-full object-cover rounded-2xl"
      />
    );
  }

  // If it's one of our defined icons
  const IconComp = AVATAR_ICONS[avatar];
  if (IconComp) {
    return <IconComp className={iconClassName} />;
  }

  // Fallback to text/emoji if it's anything else
  return <span>{avatar}</span>;
};
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
    { id: "profile", label: t("settingsProfile"), icon: User },
    { id: "preferences", label: t("settingsDietaryProfile"), icon: ChefHat },
    { id: "fridges", label: t("fridgesTitle"), icon: Refrigerator },
    { id: "interface", label: t("settingsAppearance"), icon: Palette },
    { id: "danger", label: t("settingsDangerZone"), icon: Trash2 },
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
              <div className="h-10 w-10 rounded-2xl bg-brand-gradient text-primary-foreground grid place-items-center text-lg font-black shrink-0 overflow-hidden">
                {renderAvatar(user?.avatar, (user?.username || user?.email || "?").slice(0, 1).toUpperCase(), "h-5 w-5")}
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
                <ProfileCard user={user} onSaved={refreshUser} />

                {/* Email Verification Banner if not verified */}
                {user && !user.emailVerified && (
                  <Card className="rounded-3xl bg-glass border border-solara/30 overflow-hidden shadow-sm animate-in fade-in duration-200">
                    <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <MailWarning className="h-5 w-5 text-solara shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm">{t("settingsVerifyEmailWarning")}</h4>
                          <p className="text-xs text-muted-foreground">{t("settingsVerifyEmailWarningDesc")}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={resendVerification}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-solara/20 text-foreground dark:bg-solara/15 text-[10px] font-bold uppercase tracking-widest hover:bg-solara/30 transition-colors cursor-pointer"
                      >
                        <MailWarning className="h-3 w-3 text-solara" />
                        {t("settingsEmailNotVerified")}
                      </button>
                    </CardContent>
                  </Card>
                )}
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
                <InterfaceSettingsCard />

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

function ProfileCard({
  user,
  onSaved,
}: {
  user: AuthUser | null;
  onSaved: () => Promise<void>;
}) {
  const t = useTranslations();
  const [username, setUsername] = useState(user?.username || "");
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setSelectedAvatar(user.avatar || "");
    }
  }, [user]);

  const AVATARS = [
    "user", "chefHat", "pizza", "coffee", "apple", "heart", "star", "zap", "crown", "trophy", "shield", "smile", "gift", "flame", "refrigerator"
  ];

  const hasChanges = useMemo(() => {
    const isUsernameDiff = username.trim() !== (user?.username || "").trim();
    const isAvatarDiff = selectedAvatar !== (user?.avatar || "");
    const isPasswordDiff = newPassword.length > 0;
    return isUsernameDiff || isAvatarDiff || isPasswordDiff;
  }, [username, selectedAvatar, newPassword, user]);

  const handleSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      toast.error(t("settingsPasswordsDoNotMatch"));
      return;
    }
    if (newPassword && !currentPassword) {
      toast.error(t("settingsPasswordCurrentRequired"));
      return;
    }
    if (!username.trim()) {
      toast.error(t("settingsUsernameEmpty"));
      return;
    }

    setSaving(true);
    try {
      const isUsernameDiff = username.trim() !== user?.username;
      const isAvatarDiff = selectedAvatar !== (user?.avatar || "");
      const isPasswordDiff = newPassword.length > 0;

      if (isUsernameDiff || isAvatarDiff || isPasswordDiff) {
        const body: Record<string, any> = {};
        if (isUsernameDiff) body.username = username.trim();
        if (isAvatarDiff) body.avatar = selectedAvatar || null;
        if (isPasswordDiff) {
          body.newPassword = newPassword;
          body.currentPassword = currentPassword;
        }

        await apiFetch("/auth/me", {
          method: "PATCH",
          body,
        });
      }

      await onSaved();
      toast.success(t("settingsProfileSuccess"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(getErrorMessage(err, t("settingsProfileError")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-3xl bg-glass overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-lg inline-flex items-center gap-2 font-black tracking-tight">
          <User className="h-4 w-4 text-primary" />
          {t("settingsProfileCardTitle")}
        </CardTitle>
        <CardDescription>{t("settingsProfileCardDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="pt-5 space-y-6">
        {/* Avatar Selection Section */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
            {t("settingsProfileAvatarLabel")}
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-secondary/15 border border-border/30">
            <div className="h-20 w-20 rounded-2xl bg-brand-gradient text-primary-foreground grid place-items-center shadow-md text-2xl font-black shrink-0 relative group overflow-hidden">
              {renderAvatar(selectedAvatar, (username || user?.email || "?").slice(0, 1).toUpperCase(), "h-9 w-9")}
              
              {selectedAvatar && (
                <button
                  type="button"
                  onClick={() => setSelectedAvatar("")}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[10px] font-bold shadow-xs hover:bg-destructive/95 cursor-pointer z-10"
                >
                  ✕
                </button>
              )}
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-5 gap-2 max-w-[240px]">
                {AVATARS.map((iconName) => {
                  const active = selectedAvatar === iconName;
                  const IconComp = AVATAR_ICONS[iconName];
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedAvatar(iconName)}
                      className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        active
                          ? "bg-primary/10 border-primary scale-110 shadow-xs text-primary"
                          : "bg-card border-border/60 hover:scale-105 text-muted-foreground hover:text-foreground"
                      }`}
                      title={iconName}
                    >
                      {IconComp && <IconComp className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Username section */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
            {t("settingsProfileUsernameLabel")}
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-11 rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder={t("settingsProfileUsernamePlaceholder")}
            maxLength={50}
          />
        </div>

        {/* Password change section */}
        <div className="space-y-4 pt-2 border-t border-border/20">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
            {t("settingsProfilePasswordSection")}
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground font-medium">{t("settingsProfileNewPassword")}</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={t("settingsProfileNewPasswordPlaceholder")}
                minLength={6}
              />
            </div>
            
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground font-medium">{t("settingsProfileConfirmPassword")}</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={t("settingsProfileConfirmPasswordPlaceholder")}
              />
            </div>
          </div>

          {newPassword && (
            <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
              <span className="text-xs text-destructive font-bold">{t("settingsProfileCurrentPassword")}</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-10 rounded-xl border border-destructive bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
                placeholder={t("settingsProfileCurrentPasswordPlaceholder")}
                required
              />
            </div>
          )}
        </div>

        {/* Save button */}
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
    { label: t("presetFish"), val: "Риба" },
    { label: t("presetPork"), val: "Свинина" },
    { label: t("presetBeef"), val: "Яловичина" },
    { label: t("presetMushrooms"), val: "Гриби" },
    { label: t("presetLactose"), val: "Лактоза" },
    { label: t("presetNuts"), val: "Горіхи" },
    { label: t("presetEggs"), val: "Яйця" },
    { label: t("presetPoultry"), val: "Птиця" },
    { label: t("presetOnion"), val: "Цибуля" },
    { label: t("presetGarlic"), val: "Часник" },
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
          {t("settingsPreferencesCardTitle")}
        </CardTitle>
        <CardDescription>{t("settingsPreferencesCardDesc")}</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-5 space-y-6">
        {/* Recipe Complexity Section */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
            {t("settingsPreferencesComplexityLabel")}
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "easy", label: t("settingsPreferencesComplexityEasy"), desc: t("settingsPreferencesComplexityEasyDesc") },
              { id: "normal", label: t("settingsPreferencesComplexityNormal"), desc: t("settingsPreferencesComplexityNormalDesc") },
              { id: "gourmet", label: t("settingsPreferencesComplexityGourmet"), desc: t("settingsPreferencesComplexityGourmetDesc") }
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
            {t("settingsPreferencesExcludedLabel")}
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
            {t("settingsPreferencesAdditionalLabel")}
          </label>
          <textarea
            value={additional}
            onChange={(e) => setAdditional(e.target.value)}
            placeholder={t("settingsPreferencesAdditionalPlaceholder")}
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
        toast.warning(t("settingsQuickActionsMinOne"));
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
          {t("settingsQuickActionsCardTitle")}
        </CardTitle>
        <CardDescription>
          {t("settingsQuickActionsCardDesc")}
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

function InterfaceSettingsCard() {
  const t = useTranslations();
  const { resolved } = useTheme();
  const {
    accentTheme,
    setAccentTheme,
    shoppingMode,
    setShoppingMode,
    ambientGlow,
    setAmbientGlow,
    hoverGlow,
    setHoverGlow,
    highContrast,
    setHighContrast,
  } = usePreferencesStore();

  const [tempAccent, setTempAccent] = useState(accentTheme);
  const [tempShoppingMode, setTempShoppingMode] = useState(shoppingMode);
  const [tempAmbientGlow, setTempAmbientGlow] = useState(ambientGlow);
  const [tempHoverGlow, setTempHoverGlow] = useState(hoverGlow);
  const [tempHighContrast, setTempHighContrast] = useState(highContrast);

  useEffect(() => {
    setTempAccent(accentTheme);
  }, [accentTheme]);

  useEffect(() => {
    setTempShoppingMode(shoppingMode);
  }, [shoppingMode]);

  useEffect(() => {
    setTempAmbientGlow(ambientGlow);
  }, [ambientGlow]);

  useEffect(() => {
    setTempHoverGlow(hoverGlow);
  }, [hoverGlow]);

  useEffect(() => {
    setTempHighContrast(highContrast);
  }, [highContrast]);

  const handleSave = () => {
    setAccentTheme(tempAccent);
    setShoppingMode(tempShoppingMode);
    setAmbientGlow(tempAmbientGlow);
    setHoverGlow(tempHoverGlow);
    setHighContrast(tempHighContrast);
    toast.success(t("settingsInterfaceSaved"));
  };

  const hasChanges =
    tempAccent !== accentTheme ||
    tempShoppingMode !== shoppingMode ||
    tempAmbientGlow !== ambientGlow ||
    tempHoverGlow !== hoverGlow ||
    tempHighContrast !== highContrast;

  return (
    <Card className="rounded-3xl bg-glass overflow-hidden shadow-sm">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-lg inline-flex items-center gap-2 font-black tracking-tight">
          <Palette className="h-4 w-4 text-primary" />
          {t("settingsAppearance")}
        </CardTitle>
        <CardDescription>{t("settingsAppearanceHint")}</CardDescription>
      </CardHeader>
      <CardContent className="pt-5 space-y-6 divide-y divide-border/20 pb-5">
        {/* Theme Mode Toggle (light/dark) */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-bold text-foreground">{t("settingsThemeLabel")}</span>
          <ThemeToggle />
        </div>

        {/* Accent Color picker */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm font-bold text-foreground">{t("settingsAccentLabel")}</span>
          <div className="flex gap-2">
            {resolved === "light" ? (
              <>
                <button
                  type="button"
                  onClick={() => setTempAccent("citrus")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    tempAccent === "citrus"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/40 text-muted-foreground border-border/60 hover:bg-secondary"
                  }`}
                >
                  🍊 {t("settingsAccentCitrus")}
                </button>
                <button
                  type="button"
                  onClick={() => setTempAccent("strawberry")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    tempAccent === "strawberry"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/40 text-muted-foreground border-border/60 hover:bg-secondary"
                  }`}
                >
                  🍓 {t("settingsAccentStrawberry")}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setTempAccent("blueberry")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    tempAccent === "blueberry"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/40 text-muted-foreground border-border/60 hover:bg-secondary"
                  }`}
                >
                  🫐 {t("settingsAccentBlueberry")}
                </button>
                <button
                  type="button"
                  onClick={() => setTempAccent("lime")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    tempAccent === "lime"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/40 text-muted-foreground border-border/60 hover:bg-secondary"
                  }`}
                >
                  🍈 {t("settingsAccentLime")}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Shopping Mode Toggle */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm font-bold text-foreground">{t("settingsInteractionsLabel")}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTempShoppingMode("buttons")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                tempShoppingMode === "buttons"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/40 text-muted-foreground border-border/60 hover:bg-secondary"
              }`}
            >
              {t("settingsInteractionsButtons")}
            </button>
            <button
              type="button"
              onClick={() => setTempShoppingMode("swipe")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                tempShoppingMode === "swipe"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/40 text-muted-foreground border-border/60 hover:bg-secondary"
              }`}
            >
              {t("settingsInteractionsSwipe")}
            </button>
          </div>
        </div>

        {/* Fun UI Variety toggles */}
        <div className="pt-4 space-y-3">
          <span className="text-sm font-bold text-foreground block">{t("settingsVisualVariety")}</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Ambient Glow */}
            <button
              type="button"
              onClick={() => setTempAmbientGlow(!tempAmbientGlow)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left text-xs font-bold cursor-pointer ${
                tempAmbientGlow
                  ? "bg-primary/10 border-primary text-foreground"
                  : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${tempAmbientGlow ? "bg-success border-success text-white" : "border-border/80"}`}>
                {tempAmbientGlow && <Check className="h-3 w-3" />}
              </div>
              <span>{t("settingsAmbientGlow")}</span>
            </button>

            {/* Hover Glow */}
            <button
              type="button"
              onClick={() => setTempHoverGlow(!tempHoverGlow)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left text-xs font-bold cursor-pointer ${
                tempHoverGlow
                  ? "bg-primary/10 border-primary text-foreground"
                  : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${tempHoverGlow ? "bg-success border-success text-white" : "border-border/80"}`}>
                {tempHoverGlow && <Check className="h-3 w-3" />}
              </div>
              <span>{t("settingsInteractiveGlow")}</span>
            </button>

            {/* High Contrast */}
            <button
              type="button"
              onClick={() => setTempHighContrast(!tempHighContrast)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left text-xs font-bold cursor-pointer ${
                tempHighContrast
                  ? "bg-primary/10 border-primary text-foreground"
                  : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${tempHighContrast ? "bg-success border-success text-white" : "border-border/80"}`}>
                {tempHighContrast && <Check className="h-3 w-3" />}
              </div>
              <span>{t("settingsSoftBorders")}</span>
            </button>
          </div>
        </div>

        {/* Save button footer row */}
        <div className="pt-4 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="rounded-xl font-bold px-6 shadow-sm hover:scale-[1.02] transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-1"
          >
            {t("settingsSaveInterface")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

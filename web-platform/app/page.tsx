"use client";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { useProductStore } from "@/store/useVFridgeStore";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Refrigerator,
  ShoppingBasket,
  CalendarDays,
  UtensilsCrossed,
  Flame,
  Settings as SettingsIcon,
  AlertTriangle,
  CalendarClock,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsTile } from "@/components/analytics-tile";
import { ActiveFridgeBanner } from "@/components/active-fridge-banner";
import { useFridges } from "@/providers/fridge-provider";
import { usePreferencesStore } from "@/store/usePreferencesStore";

export default function Dashboard() {
  const t = useTranslations();
  const { user } = useAuth();
  const { fridges, status: fridgesStatus } = useFridges();
  const products = useProductStore((state) => state.products);
  const { quickActions } = usePreferencesStore();

  const allActions = [
    {
      key: "fridge",
      href: "/fridge",
      icon: Refrigerator,
      title: t("dashboardQuickFridgeTitle"),
      description: t("dashboardQuickFridgeDesc"),
      badge: `${products.length} ${t("dashboardItemsCount", { count: products.length })}`,
    },
    {
      key: "recipe",
      href: "/recipe",
      icon: UtensilsCrossed,
      title: t("dashboardQuickChefTitle"),
      description: t("dashboardQuickChefDesc"),
      featured: true,
    },
    {
      key: "planner",
      href: "/planner",
      icon: CalendarDays,
      title: t("dashboardQuickPlannerTitle"),
      description: t("dashboardQuickPlannerDesc"),
    },
    {
      key: "shopping",
      href: "/shopping",
      icon: ShoppingBasket,
      title: t("dashboardQuickShoppingTitle"),
      description: t("dashboardQuickShoppingDesc"),
    },
    {
      key: "nutrition",
      href: "/nutrition",
      icon: Flame,
      title: t("dashboardQuickNutritionTitle"),
      description: t("dashboardQuickNutritionDesc"),
    },
    {
      key: "settings",
      href: "/settings",
      icon: SettingsIcon,
      title: t("dashboardQuickSettingsTitle"),
      description: t("dashboardQuickSettingsDesc"),
    },
  ];

  const stats = useMemo(() => {
    const now = new Date();
    const threeDays = new Date();
    threeDays.setDate(now.getDate() + 3);

    let expired = 0;
    let soon = 0;
    for (const p of products) {
      if (!p.expiryDate) continue;
      const d = new Date(p.expiryDate);
      if (d < now) expired++;
      else if (d < threeDays) soon++;
    }
    return { total: products.length, expired, soon };
  }, [products]);

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
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest">
              <LayoutDashboard className="h-3 w-3" />
              {t("navDashboard")}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              {user?.username
                ? t.rich("dashboardWelcomeWithName", {
                    name: user.username,
                    primary: (chunks) => <span className="text-primary">{chunks}</span>,
                  })
                : t("appTitle")}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-medium">
              {t("dashboardHeroSubtitle")}
            </p>
            <ActiveFridgeBanner icon={Refrigerator} label={t("dashboardActiveFor")} />
          </div>
        </header>

        {/* Overview Stats section */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label={t("dashboardStatTotal")}
            value={stats.total}
            tone="primary"
            icon={<Refrigerator className="h-5 w-5" />}
          />
          <StatCard
            label={t("dashboardStatSoon")}
            value={stats.soon}
            tone="warning"
            hint={t("dashboardStatSoonHint")}
            icon={<CalendarClock className="h-5 w-5" />}
          />
          <StatCard
            label={t("dashboardStatExpired")}
            value={stats.expired}
            tone="danger"
            hint={t("dashboardStatExpiredHint")}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
        </section>

        {/* Quick Actions Grid */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Швидкі дії
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allActions
              .filter((act) => quickActions.includes(act.key))
              .map((act) => (
                <QuickActionCard
                  key={act.key}
                  href={act.href}
                  icon={act.icon}
                  title={act.title}
                  description={act.description}
                  badge={act.badge}
                  featured={act.featured}
                />
              ))}
          </div>
        </section>

        {/* Always visible Analytics Section */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Аналітика споживання
          </h2>
          <div className="rounded-3xl border border-border/60 bg-glass/25 p-5 md:p-6 shadow-xs">
            <AnalyticsTile />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: number;
  hint?: string;
  tone: "primary" | "warning" | "danger";
  icon: React.ReactNode;
}) {
  const tones = {
    primary: "bg-secondary/60 border-secondary text-secondary-foreground",
    warning: "bg-solara/20 border-solara/50 text-foreground dark:bg-solara/10 dark:border-solara/30",
    danger: "bg-destructive/10 border-destructive/30 text-destructive",
  };
  return (
    <div className={`rounded-2xl border p-5 ${tones[tone]} transition-transform hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">{label}</span>
        <div className="opacity-70">{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black tracking-tight">{value}</span>
        {hint && <span className="text-xs font-medium opacity-70">{hint}</span>}
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
  featured = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: string;
  featured?: boolean;
}) {
  if (featured) {
    return (
      <Link
        href={href}
        className="group relative rounded-3xl border border-primary/20 bg-brand-gradient text-primary-foreground p-6 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between min-h-[150px] cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest bg-white/30 text-white px-2 py-0.5 rounded-full">
            AI Рекомендовано
          </span>
        </div>
        <div className="mt-4">
          <h3 className="font-black text-lg tracking-tight leading-snug">
            {title}
          </h3>
          <p className="text-xs opacity-90 mt-1">
            {description}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group relative rounded-3xl border border-border/60 bg-card p-6 shadow-xs hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between min-h-[150px] cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="h-12 w-12 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
          <Icon className="h-6 w-6" />
        </div>
        {badge && (
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-secondary/35 px-2.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="font-black text-lg tracking-tight leading-snug group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </div>
    </Link>
  );
}

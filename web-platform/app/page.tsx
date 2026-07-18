"use client";
import { AddProducts } from "@/components/add-products";
import { ProductList } from "@/components/ProductList";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { useProductStore } from "@/store/useVFridgeStore";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Refrigerator, AlertTriangle, Sparkles, CalendarClock, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsTile } from "@/components/analytics-tile";
import { ActiveFridgeBanner } from "@/components/active-fridge-banner";
import { useFridges } from "@/providers/fridge-provider";

export default function Dashboard() {
  const t = useTranslations();
  const { user } = useAuth();
  const { fridges, status: fridgesStatus } = useFridges();
  const products = useProductStore((state) => state.products);

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

  // Without a fridge there's nothing for the products list to scope to.
  // Surface a CTA that points to /settings instead of letting the rest of the
  // page silently 401 every backend call.
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
              <Refrigerator className="h-3 w-3" />
              {t("navFridge")}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              {user?.username
                ? t.rich("dashboardWelcomeWithName", {
                    name: user.username,
                    primary: (chunks) => <span className="text-primary">{chunks}</span>,
                  })
                : t("dashboardTitle")}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-medium">
              {t("dashboardHeroSubtitle")}
            </p>
            <ActiveFridgeBanner icon={Refrigerator} label={t("dashboardActiveFor")} />
          </div>
          <div className="hidden md:block">
            <AddProducts />
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Link
            href="/recipe"
            className="rounded-2xl border border-primary/20 bg-brand-gradient text-primary-foreground p-5 transition-all hover:scale-[1.02] shadow-md hover:shadow-lg flex flex-col justify-between cursor-pointer min-h-[120px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest opacity-90">{t("dashboardOpenChef")}</span>
              <Sparkles className="h-5 w-5 opacity-90" />
            </div>
            <div className="mt-3">
              <h4 className="font-black text-lg tracking-tight leading-snug">
                {t("dashboardChefCtaTitle")}
              </h4>
              <p className="text-[11px] opacity-80 line-clamp-1 mt-0.5">
                {t("dashboardChefCtaBody")}
              </p>
            </div>
          </Link>
        </section>

        {/* Collapsible Analytics Section */}
        <div className="rounded-3xl border border-border/60 bg-glass/20 overflow-hidden shadow-xs">
          <details className="group">
            <summary className="flex items-center justify-between p-5 md:p-6 cursor-pointer select-none font-bold text-sm text-muted-foreground hover:text-foreground transition-colors list-none">
              <span className="inline-flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                Аналітика споживання (показати/приховати)
              </span>
              <span className="text-xs transition-transform group-open:rotate-180">▼</span>
            </summary>
            <div className="px-5 pb-6 md:px-6 md:pb-8 border-t border-border/40 pt-5 bg-card/10">
              <AnalyticsTile />
            </div>
          </details>
        </div>

        <main className="space-y-4">
          <div className="md:hidden w-full">
            <AddProducts />
          </div>

          <div className="rounded-3xl border border-border/60 shadow-xl bg-card overflow-hidden">
            <div className="p-5 md:p-6 border-b border-border/60 bg-muted/40 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{t("dashboardInventory")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("dashboardInventorySortHint")}
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2.5 py-1 rounded-full bg-background border border-border/60">
                {t("dashboardItemsCount", { count: stats.total })}
              </span>
            </div>
            <div className="p-4 md:p-6 min-h-[24rem]">
              <ProductList />
            </div>
          </div>
        </main>
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
  // All three tones stay on the citrus palette — no off-brand tailwind yellows.
  // "warning" leans on Solara (honey-orange) so expiring-soon reads warm, not alien.
  // Text stays on the standard foreground for readability in both themes; the tone
  // colour lives in the surface, border and icon, not the body text.
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

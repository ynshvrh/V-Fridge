"use client";
import { AddProducts } from "@/components/add-products";
import { ProductList } from "@/components/ProductList";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { useProductStore } from "@/store/useVFridgeStore";
import { useMemo } from "react";
import { Refrigerator, AlertTriangle, Sparkles, ArrowRight, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalyticsTile } from "@/components/analytics-tile";
import { ActiveFridgeBanner } from "@/components/active-fridge-banner";

export default function Dashboard() {
  const { user } = useAuth();
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

  return (
    <div className="min-h-full w-full p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest">
              <Refrigerator className="h-3 w-3" />
              Your fridge
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              {user?.username ? (
                <>Welcome, <span className="text-primary">{user.username}</span>!</>
              ) : (
                "Dashboard"
              )}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-medium">
              Manage your groceries and get fresh recipe ideas from AI.
            </p>
            <ActiveFridgeBanner icon={Refrigerator} label="Inventory for" />
          </div>
          <div className="hidden md:block">
            <AddProducts />
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total items"
            value={stats.total}
            tone="primary"
            icon={<Refrigerator className="h-5 w-5" />}
          />
          <StatCard
            label="Spoiling soon"
            value={stats.soon}
            tone="warning"
            hint="within the next 3 days"
            icon={<CalendarClock className="h-5 w-5" />}
          />
          <StatCard
            label="Expired"
            value={stats.expired}
            tone="danger"
            hint="time to toss"
            icon={<AlertTriangle className="h-5 w-5" />}
          />
        </section>

        <AnalyticsTile />

        <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/8 via-secondary/30 to-transparent p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 justify-between">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-md shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black tracking-tight">Not sure what to cook?</h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-xl">
                Ask the AI chef — it will suggest a recipe from items already in your fridge.
              </p>
            </div>
          </div>
          <Button asChild size="lg" className="rounded-xl font-bold shrink-0 shadow-md shadow-primary/20">
            <Link href="/recipe">
              Open AI chef
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        <main className="space-y-4">
          <div className="md:hidden w-full">
            <AddProducts />
          </div>

          <div className="rounded-3xl border border-border/60 shadow-xl bg-card overflow-hidden">
            <div className="p-5 md:p-6 border-b border-border/60 bg-muted/40 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Inventory</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sorted by expiry date
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2.5 py-1 rounded-full bg-background border border-border/60">
                {stats.total} {stats.total === 1 ? "item" : "items"}
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
  const tones = {
    primary: "bg-secondary/60 border-secondary text-secondary-foreground",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950/20 dark:border-yellow-900/40 dark:text-yellow-200",
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

"use client";
import { AddProducts } from "@/components/add-products";
import { ProductList } from "@/components/ProductList";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { useProductStore } from "@/store/useVFridgeStore";
import { useMemo } from "react";
import { Refrigerator, AlertTriangle, Sparkles, ArrowRight, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";

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
              Ваш холодильник
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              {user?.username ? (
                <>Вітаємо, <span className="text-primary">{user.username}</span>!</>
              ) : (
                "Дашборд"
              )}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-medium">
              Керуйте продуктами та отримуйте свіжі ідеї рецептів від AI.
            </p>
          </div>
          <div className="hidden md:block">
            <AddProducts />
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Всього продуктів"
            value={stats.total}
            tone="primary"
            icon={<Refrigerator className="h-5 w-5" />}
          />
          <StatCard
            label="Швидко зіпсується"
            value={stats.soon}
            tone="warning"
            hint="у найближчі 3 дні"
            icon={<CalendarClock className="h-5 w-5" />}
          />
          <StatCard
            label="Прострочені"
            value={stats.expired}
            tone="danger"
            hint="час викинути"
            icon={<AlertTriangle className="h-5 w-5" />}
          />
        </section>

        <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/8 via-secondary/30 to-transparent p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 justify-between">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-md shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black tracking-tight">Не знаєте що приготувати?</h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-xl">
                Запитайте AI-кухаря — він порадить рецепт із того, що вже є в холодильнику.
              </p>
            </div>
          </div>
          <Button asChild size="lg" className="rounded-xl font-bold shrink-0 shadow-md shadow-primary/20">
            <Link href="/recipe">
              Відкрити AI-кухаря
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
                <h3 className="font-bold text-lg">Інвентар</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Сортовано за датою придатності
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2.5 py-1 rounded-full bg-background border border-border/60">
                {stats.total} {stats.total === 1 ? "товар" : "товарів"}
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

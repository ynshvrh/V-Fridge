"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2, TrendingDown, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { categoryLabelKey } from "@/interfaces/categories";

type AnalyticsSummary = {
  mostWasted: Array<{ productName: string; totalQuantity: number; occurrences: number; category: string }>;
  fastestConsumed: Array<{ productName: string; category: string; ageDays: number }>;
  weeklyTrends: Array<{ weekStart: string; consumed: number; wasted: number; expired: number }>;
};

export function AnalyticsTile() {
  const t = useTranslations();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AnalyticsSummary>("/analytics")
      .then(setData)
      .catch(() => {/* dashboard tile is optional — silent on failure */})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!data) return null;

  const isEmpty =
    data.mostWasted.length === 0 &&
    data.fastestConsumed.length === 0 &&
    data.weeklyTrends.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8 px-4 space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center shadow-sm">
          <TrendingDown className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="font-bold text-lg tracking-tight">Аналітика поки що порожня</h3>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            {"Додавайте продукти у ваш холодильник, готуйте з AI Шефом та відзначайте використані інгредієнти, щоб тут з'явилися інтерактивні графіки споживання та аналіз харчових відходів."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="rounded-3xl border-border/60 bg-card shadow-sm">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-destructive/10 text-destructive grid place-items-center">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-black tracking-tight text-sm">{t("analyticsMostWasted")}</h3>
              <p className="text-[11px] text-muted-foreground">{t("analyticsMostWastedSubtitle")}</p>
            </div>
          </div>
          {data.mostWasted.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">{t("analyticsNoWasted")}</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {data.mostWasted.slice(0, 3).map((row) => (
                <li key={row.productName} className="flex items-baseline justify-between gap-2">
                  <span className="truncate">{row.productName}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {row.totalQuantity.toFixed(1)} · {row.occurrences}×
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60 bg-card shadow-sm">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-black tracking-tight text-sm">{t("analyticsFastestConsumed")}</h3>
              <p className="text-[11px] text-muted-foreground">{t("analyticsFastestConsumedSubtitle")}</p>
            </div>
          </div>
          {data.fastestConsumed.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">{t("analyticsNoConsumed")}</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {data.fastestConsumed.slice(0, 3).map((row) => (
                <li key={row.productName} className="flex items-baseline justify-between gap-2">
                  <span className="truncate">
                    {row.productName} <span className="text-[10px] text-muted-foreground">· {t(categoryLabelKey(row.category))}</span>
                  </span>
                  <span className="text-xs font-bold shrink-0">{t("analyticsDaysShort", { n: row.ageDays })}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60 bg-card shadow-sm">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-secondary/40 text-secondary-foreground grid place-items-center">
              <TrendingDown className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-black tracking-tight text-sm">{t("analyticsWeekly")}</h3>
              <p className="text-[11px] text-muted-foreground">{t("analyticsWeeklySubtitle")}</p>
            </div>
          </div>
          {data.weeklyTrends.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">{t("analyticsNoHistory")}</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {data.weeklyTrends.slice(-4).map((row) => {
                const total = row.consumed + row.wasted + row.expired || 1;
                return (
                  <li key={row.weekStart} className="space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{row.weekStart}</span>
                      <span>{t("analyticsConsumedWasted", { c: row.consumed, w: row.wasted + row.expired })}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
                      <div
                        className="bg-primary"
                        style={{ width: `${(row.consumed / total) * 100}%` }}
                      />
                      <div
                        className="bg-destructive"
                        style={{ width: `${((row.wasted + row.expired) / total) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

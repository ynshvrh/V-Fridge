"use client";

import { useEffect, useState } from "react";
import { Trash2, TrendingDown, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { categoryLabel } from "@/interfaces/categories";

type AnalyticsSummary = {
  mostWasted: Array<{ productName: string; totalQuantity: number; occurrences: number; category: string }>;
  fastestConsumed: Array<{ productName: string; category: string; ageDays: number }>;
  weeklyTrends: Array<{ weekStart: string; consumed: number; wasted: number; expired: number }>;
};

export function AnalyticsTile() {
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
  if (isEmpty) return null;

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="rounded-3xl border-border/60 bg-card shadow-sm">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-destructive/10 text-destructive grid place-items-center">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-black tracking-tight text-sm">Most wasted</h3>
              <p className="text-[11px] text-muted-foreground">Last 30 days</p>
            </div>
          </div>
          {data.mostWasted.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No wasted items yet — well done.</p>
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
              <h3 className="font-black tracking-tight text-sm">Fastest consumed</h3>
              <p className="text-[11px] text-muted-foreground">Days from add to finished</p>
            </div>
          </div>
          {data.fastestConsumed.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No items finished yet.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {data.fastestConsumed.slice(0, 3).map((row) => (
                <li key={row.productName} className="flex items-baseline justify-between gap-2">
                  <span className="truncate">
                    {row.productName} <span className="text-[10px] text-muted-foreground">· {categoryLabel(row.category)}</span>
                  </span>
                  <span className="text-xs font-bold shrink-0">{row.ageDays}d</span>
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
              <h3 className="font-black tracking-tight text-sm">Weekly</h3>
              <p className="text-[11px] text-muted-foreground">Consumed vs wasted</p>
            </div>
          </div>
          {data.weeklyTrends.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Not enough history yet.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {data.weeklyTrends.slice(-4).map((row) => {
                const total = row.consumed + row.wasted + row.expired || 1;
                return (
                  <li key={row.weekStart} className="space-y-1">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{row.weekStart}</span>
                      <span>{row.consumed}c · {row.wasted + row.expired}w</span>
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

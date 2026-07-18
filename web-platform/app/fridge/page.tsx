"use client";
import { AddProducts } from "@/components/add-products";
import { ProductList } from "@/components/ProductList";
import Link from "next/link";
import { useProductStore } from "@/store/useVFridgeStore";
import { useTranslations } from "next-intl";
import { Refrigerator, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActiveFridgeBanner } from "@/components/active-fridge-banner";
import { useFridges } from "@/providers/fridge-provider";

export default function FridgePage() {
  const t = useTranslations();
  const { fridges, status: fridgesStatus } = useFridges();
  const products = useProductStore((state) => state.products);

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
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
              {t("navFridge")}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-medium">
              {t("dashboardInventorySortHint")}
            </p>
            <ActiveFridgeBanner icon={Refrigerator} label={t("dashboardActiveFor")} />
          </div>
          <div className="hidden md:block">
            <AddProducts />
          </div>
        </header>

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
                {t("dashboardItemsCount", { count: products.length })}
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

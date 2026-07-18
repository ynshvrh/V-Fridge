"use client";
import Chat from "@/components/chat";
import { useFridges } from "@/providers/fridge-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Refrigerator, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function RecipePage() {
  const t = useTranslations();
  const { fridges, status: fridgesStatus } = useFridges();

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
    <div className="h-full w-full flex flex-col p-3 md:p-6">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <main className="flex-1 min-h-0 relative flex flex-col">
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-secondary/40 via-transparent to-primary/10 blur-2xl opacity-60" />
          <div className="flex-1 h-full w-full rounded-3xl border border-border/60 shadow-2xl shadow-primary/5 bg-card overflow-hidden flex flex-col">
            <Chat />
          </div>
        </main>
      </div>
    </div>
  );
}

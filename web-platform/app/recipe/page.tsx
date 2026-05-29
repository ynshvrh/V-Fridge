"use client";
import Chat from "@/components/chat";
import { useAuth } from "@/providers/auth-provider";
import { useTranslations } from "next-intl";
import { ChefHat } from "lucide-react";

export default function RecipePage() {
  const t = useTranslations();
  const { user } = useAuth();

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-5 min-h-0">
        <header className="flex flex-col items-center text-center space-y-2 shrink-0">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest">
            <ChefHat className="h-3.5 w-3.5" />
            {t("chatTitle")}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            {t("chatEmptyHero")}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground font-medium max-w-xl">
            {user?.username
              ? t("recipeHeroBodyWithName", { name: user.username })
              : t("recipeHeroBodyAnonymous")}
          </p>
        </header>

        <main className="flex-1 min-h-0 relative">
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-secondary/40 via-transparent to-primary/10 blur-2xl opacity-60" />
          <div className="h-full w-full rounded-3xl border border-border/60 shadow-2xl shadow-primary/5 bg-card overflow-hidden flex flex-col">
            <Chat />
          </div>
        </main>

        <footer className="py-1 shrink-0 text-center">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-tighter">
            {t("recipeFooter")}
          </p>
        </footer>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Refrigerator, MailCheck, MailWarning, LogIn } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

type VerifyState =
  | { kind: "loading" }
  | { kind: "ok" }
  | { kind: "error"; message: string };

function VerifyEmailInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const status = params.get("status"); // when the API redirected back ("ok" | "error")
  const reason = params.get("reason");

  const [state, setState] = useState<VerifyState>(() => {
    if (status === "ok") return { kind: "ok" };
    if (status === "error") return { kind: "error", message: reason || "Не вдалось підтвердити email" };
    return { kind: "loading" };
  });

  useEffect(() => {
    if (state.kind !== "loading") return;
    if (!token) {
      setState({ kind: "error", message: "Токен відсутній — відкрийте посилання з листа" });
      return;
    }
    apiFetch<{ success: true }>("/auth/verify-email", {
      method: "POST",
      body: { token },
      skipAuth: true,
    })
      .then(() => {
        setState({ kind: "ok" });
        // Drop the one-shot token from the URL so refresh doesn't re-POST it.
        router.replace("/verify-email?status=ok");
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Не вдалось підтвердити email";
        setState({ kind: "error", message });
        router.replace(`/verify-email?status=error&reason=${encodeURIComponent(message)}`);
      });
  }, [token, state.kind, router]);

  return (
    <Card className="rounded-3xl border-border/60 shadow-2xl shadow-primary/5">
      <CardHeader className="space-y-2 text-center pb-2">
        {state.kind === "loading" && (
          <>
            <div className="h-14 w-14 rounded-2xl bg-secondary text-secondary-foreground grid place-items-center mx-auto">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">Підтверджуємо email…</CardTitle>
            <CardDescription>Зачекайте, це лише мить.</CardDescription>
          </>
        )}
        {state.kind === "ok" && (
          <>
            <div className="h-14 w-14 rounded-2xl bg-success/15 text-success grid place-items-center mx-auto">
              <MailCheck className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">Email підтверджено!</CardTitle>
            <CardDescription>Ваш акаунт готовий до роботи.</CardDescription>
          </>
        )}
        {state.kind === "error" && (
          <>
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive grid place-items-center mx-auto">
              <MailWarning className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">Підтвердити не вдалося</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </>
        )}
      </CardHeader>

      <CardContent />

      <CardFooter className="flex flex-col gap-3 pt-2">
        {state.kind === "ok" && (
          <Button asChild className="w-full h-11 rounded-xl font-bold shadow-md shadow-primary/20">
            <Link href="/signin">
              <LogIn className="mr-2 h-4 w-4" />
              Увійти в акаунт
            </Link>
          </Button>
        )}
        {state.kind === "error" && (
          <Button asChild variant="outline" className="w-full h-11 rounded-xl">
            <Link href="/signin">Повернутись до входу</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ambient px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="flex items-center justify-center gap-3 group">
          <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <Refrigerator className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <h2 className="text-2xl font-black text-primary tracking-tight">V-Fridge</h2>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Smart Kitchen</p>
          </div>
        </Link>

        <Suspense fallback={null}>
          <VerifyEmailInner />
        </Suspense>
      </div>
    </div>
  );
}

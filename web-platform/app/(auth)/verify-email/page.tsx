"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Refrigerator, MailCheck, MailWarning, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useAuth, type AuthUser } from "@/providers/auth-provider";

type VerifyState =
  | { kind: "loading" }
  | { kind: "ok" }
  | { kind: "error"; message: string };

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: AuthUser;
};

function VerifyEmailInner() {
  const t = useTranslations();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const status = params.get("status");
  const reason = params.get("reason");

  const { applySession } = useAuth();
  const [state, setState] = useState<VerifyState>(() => {
    if (status === "ok") return { kind: "ok" };
    if (status === "error") return { kind: "error", message: reason || t("verifyFailed") };
    if (!token) return { kind: "error", message: t("verifyMissingToken") };
    return { kind: "loading" };
  });

  useEffect(() => {
    if (state.kind !== "loading" || !token) return;

    let cancelled = false;
    apiFetch<TokenPair>("/auth/verify-email", {
      method: "POST",
      body: { token },
      skipAuth: true,
    })
      .then((pair) => {
        if (cancelled) return;
        applySession(pair);
        setState({ kind: "ok" });
        // Drop the one-shot token from the URL, then hop to the dashboard after a beat
        // so the user actually sees the "verified" confirmation.
        router.replace("/verify-email?status=ok");
        setTimeout(() => router.replace("/"), 1200);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : t("verifyFailed");
        setState({ kind: "error", message });
        router.replace(`/verify-email?status=error&reason=${encodeURIComponent(message)}`);
      });

    return () => { cancelled = true; };
  }, [token, state.kind, router, applySession, t]);

  return (
    <Card className="rounded-3xl border-border/60 shadow-2xl shadow-primary/5">
      <CardHeader className="space-y-2 text-center pb-2">
        {state.kind === "loading" && (
          <>
            <div className="h-14 w-14 rounded-2xl bg-secondary text-secondary-foreground grid place-items-center mx-auto">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">{t("verifyTitle")}</CardTitle>
            <CardDescription>{t("verifyLoadingBody")}</CardDescription>
          </>
        )}
        {state.kind === "ok" && (
          <>
            <div className="h-14 w-14 rounded-2xl bg-success/15 text-success grid place-items-center mx-auto">
              <MailCheck className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">{t("verifyOkTitle")}</CardTitle>
            <CardDescription>{t("verifyOkBody")}</CardDescription>
          </>
        )}
        {state.kind === "error" && (
          <>
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive grid place-items-center mx-auto">
              <MailWarning className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">{t("verifyErrorTitle")}</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </>
        )}
      </CardHeader>

      <CardContent />

      <CardFooter className="flex flex-col gap-3 pt-2">
        {state.kind === "ok" && (
          <Button asChild className="w-full h-11 rounded-xl font-bold shadow-md shadow-primary/20">
            <Link href="/">
              {t("verifyGoToDashboard")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
        {state.kind === "error" && (
          <Button asChild variant="outline" className="w-full h-11 rounded-xl">
            <Link href="/signin">{t("signupBackToSignIn")}</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  const t = useTranslations();
  return (
    <div className="flex min-h-screen items-center justify-center bg-ambient px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="flex items-center justify-center gap-3 group">
          <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <Refrigerator className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <h2 className="text-2xl font-black text-primary tracking-tight">V-Fridge</h2>
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{t("appTagline")}</p>
          </div>
        </Link>

        <Suspense fallback={null}>
          <VerifyEmailInner />
        </Suspense>
      </div>
    </div>
  );
}

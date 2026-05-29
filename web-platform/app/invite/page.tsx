"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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
import { Loader2, Refrigerator, Users, ArrowRight, MailWarning } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

type AcceptResponse = { fridgeId: number; fridgeName: string };

type ApiState =
  | { phase: "idle" }
  | { phase: "pending" }
  | { phase: "ok"; fridgeId: number; fridgeName: string }
  | { phase: "error"; message: string };

function InviteInner() {
  const t = useTranslations();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const { status: authStatus, user } = useAuth();
  const [apiState, setApiState] = useState<ApiState>({ phase: "idle" });

  // The API call only runs when the caller is authenticated and verified.
  const canCall = !!token && authStatus === "authenticated" && !!user?.emailVerified;

  useEffect(() => {
    if (!canCall || !token) return;
    let cancelled = false;

    // setState calls in the async response handler — this is exactly the "external system
    // resolves, then update React" pattern the docs describe, but eslint can't tell the
    // .then callback apart from a synchronous body call.
    /* eslint-disable react-hooks/set-state-in-effect */
    setApiState({ phase: "pending" });
    apiFetch<AcceptResponse>("/fridges/accept", { method: "POST", body: { token } })
      .then((data) => {
        if (!cancelled) setApiState({ phase: "ok", fridgeId: data.fridgeId, fridgeName: data.fridgeName });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          const code = (err.payload as { code?: string } | undefined)?.code;
          if (code === "EMAIL_NOT_VERIFIED") {
            setApiState({ phase: "idle" });
            return;
          }
        }
        setApiState({ phase: "error", message: getErrorMessage(err, t("inviteGenericError")) });
      });
    /* eslint-enable react-hooks/set-state-in-effect */

    return () => { cancelled = true; };
  }, [canCall, token, t]);

  // Everything derives from token + authStatus + user + apiState.
  const view = useMemo(() => {
    if (!token) return { kind: "error" as const, message: t("inviteTokenMissing") };
    if (authStatus === "loading") return { kind: "loading" as const };
    if (authStatus === "unauthenticated") return { kind: "needs-auth" as const, token };
    if (user && !user.emailVerified) return { kind: "needs-verify" as const };
    if (apiState.phase === "pending" || apiState.phase === "idle") return { kind: "loading" as const };
    if (apiState.phase === "ok") return { kind: "ok" as const, fridgeId: apiState.fridgeId, fridgeName: apiState.fridgeName };
    return { kind: "error" as const, message: apiState.message };
  }, [token, authStatus, user, apiState, t]);

  return (
    <Card className="rounded-3xl border-border/60 shadow-2xl shadow-primary/5">
      <CardHeader className="space-y-2 text-center pb-2">
        <div className={view.kind === "error"
          ? "h-14 w-14 rounded-2xl bg-destructive/10 text-destructive grid place-items-center mx-auto"
          : "h-14 w-14 rounded-2xl bg-secondary text-secondary-foreground grid place-items-center mx-auto"}>
          {view.kind === "error" ? <MailWarning className="h-7 w-7" /> : <Users className="h-7 w-7" />}
        </div>
        {view.kind === "loading" && (
          <>
            <CardTitle className="text-2xl font-black tracking-tight">{t("inviteCheckingTitle")}</CardTitle>
            <CardDescription><Loader2 className="h-4 w-4 animate-spin inline" /> {t("inviteCheckingBody")}</CardDescription>
          </>
        )}
        {view.kind === "needs-auth" && (
          <>
            <CardTitle className="text-2xl font-black tracking-tight">{t("inviteNeedsAuthTitle")}</CardTitle>
            <CardDescription>{t("inviteNeedsAuthBody")}</CardDescription>
          </>
        )}
        {view.kind === "needs-verify" && (
          <>
            <CardTitle className="text-2xl font-black tracking-tight">{t("inviteNeedsVerifyTitle")}</CardTitle>
            <CardDescription>{t("inviteNeedsVerifyBody")}</CardDescription>
          </>
        )}
        {view.kind === "ok" && (
          <>
            <CardTitle className="text-2xl font-black tracking-tight">{t("inviteWelcome", { name: view.fridgeName })}</CardTitle>
            <CardDescription>{t("inviteWelcomeBody")}</CardDescription>
          </>
        )}
        {view.kind === "error" && (
          <>
            <CardTitle className="text-2xl font-black tracking-tight">{t("inviteErrorTitle")}</CardTitle>
            <CardDescription>{view.message}</CardDescription>
          </>
        )}
      </CardHeader>

      <CardContent />

      <CardFooter className="flex flex-col gap-3 pt-2">
        {view.kind === "needs-auth" && (
          <>
            <Button asChild className="w-full h-11 rounded-xl font-bold">
              <Link href={`/signin?next=/invite?token=${encodeURIComponent(view.token)}`}>{t("signinSubmit")}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-11 rounded-xl">
              <Link href={`/signup?next=/invite?token=${encodeURIComponent(view.token)}`}>{t("signupSubmit")}</Link>
            </Button>
          </>
        )}
        {view.kind === "ok" && (
          <Button onClick={() => router.replace("/settings")} className="w-full h-11 rounded-xl font-bold gap-2">
            {t("inviteOpenSettings")} <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        {view.kind === "error" && (
          <Button asChild variant="outline" className="w-full h-11 rounded-xl">
            <Link href="/">{t("inviteBackToDashboard")}</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function InvitePage() {
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
          <InviteInner />
        </Suspense>
      </div>
    </div>
  );
}

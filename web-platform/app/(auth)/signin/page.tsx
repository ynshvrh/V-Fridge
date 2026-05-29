"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Refrigerator, LogIn, MailWarning } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { ApiError, apiFetch } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";
import { GoogleSignInButton } from "@/components/google-signin-button";
import { Separator } from "@/components/ui/separator";

function buildSignInSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email(t("signinValidationInvalidEmail")),
    password: z.string().min(1, t("signinValidationPasswordRequired")),
  });
}

function VerificationBanner() {
  const t = useTranslations();
  const params = useSearchParams();
  const verified = params.get("verified");
  const reason = params.get("reason");

  useEffect(() => {
    if (verified === "1") toast.success(t("verifyOkTitle"));
    else if (verified === "0") toast.error(reason || t("verifyFailed"));
  }, [verified, reason, t]);

  return null;
}

export default function SignInPage() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNeedsVerification(false);

    const validation = buildSignInSchema(t).safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || t("signinValidationInvalidEmail"));
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError && (err.payload as { code?: string })?.code === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true);
        setError("");
      } else {
        const msg = err instanceof Error ? err.message : t("signinInvalidCreds");
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await apiFetch("/auth/resend-verification", {
        method: "POST",
        body: { email },
        skipAuth: true,
      });
      toast.success(t("signinResendSent"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("settingsPreferencesFailed")));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ambient px-4 py-10">
      <Suspense fallback={null}>
        <VerificationBanner />
      </Suspense>
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

        <Card className="rounded-3xl border-border/60 shadow-2xl shadow-primary/5">
          <CardHeader className="space-y-1 text-center pb-2">
            <CardTitle className="text-2xl font-black tracking-tight">{t("signinTitle")}</CardTitle>
            <CardDescription>{t("signinSubheading")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 pb-2 space-y-4">
            <GoogleSignInButton />
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("wordOr")}</span>
              <Separator className="flex-1" />
            </div>
          </CardContent>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl text-center font-medium">
                  {error}
                </div>
              )}
              {needsVerification && (
                <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/40 space-y-3">
                  <div className="flex items-start gap-3">
                    <MailWarning className="h-5 w-5 text-yellow-900 dark:text-yellow-200 shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-900 dark:text-yellow-200">
                      <p className="font-bold mb-1">{t("signinNotVerifiedTitle")}</p>
                      <p>{t("signinNotVerifiedBody")}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    variant="outline"
                    className="w-full h-10 rounded-lg border-yellow-300 dark:border-yellow-900/60 text-yellow-900 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                  >
                    {resending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("signinSendingVerification")}</>
                    ) : t("signinResend")}
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("signinEmail")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("authEmailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t("signinPassword")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button type="submit" className="w-full h-11 rounded-xl font-bold shadow-md shadow-primary/20" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("signinSigningIn")}
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    {t("signinSubmit")}
                  </>
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                {t.rich("signinNoAccountRich", {
                  link: (chunks) => (
                    <Link href="/signup" className="text-primary hover:underline font-semibold">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

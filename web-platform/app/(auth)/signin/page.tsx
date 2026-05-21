"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Loader2, Refrigerator, LogIn, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";

const signInSchema = z.object({
  email: z.string().email("Некоректний формат email"),
  password: z.string().min(1, "Пароль обов'язковий"),
});

function VerificationBanner() {
  const params = useSearchParams();
  const verified = params.get("verified");
  const reason = params.get("reason");

  useEffect(() => {
    if (verified === "1") toast.success("Email успішно підтверджено!");
    else if (verified === "0") toast.error(reason || "Не вдалось підтвердити email");
  }, [verified, reason]);

  return null;
}

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validation = signInSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Некоректні дані");
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Невірний email або пароль";
      setError(msg);
    } finally {
      setLoading(false);
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
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Smart Kitchen</p>
          </div>
        </Link>

        <Card className="rounded-3xl border-border/60 shadow-2xl shadow-primary/5">
          <CardHeader className="space-y-1 text-center pb-2">
            <CardTitle className="text-2xl font-black tracking-tight">З поверненням</CardTitle>
            <CardDescription>Увійдіть, щоб керувати своїм холодильником</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl text-center font-medium">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Пароль
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
                    Входимо…
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Увійти
                  </>
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Ще не маєте акаунту?{" "}
                <Link href="/signup" className="text-primary hover:underline font-semibold">
                  Зареєструватися
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="text-[11px] text-center text-muted-foreground/70 leading-relaxed px-6">
          <CheckCircle2 className="inline h-3.5 w-3.5 mr-1 text-success" />
          Ваш email буде підтверджено після першого входу. Перевірте поштову скриньку.
        </p>
      </div>
    </div>
  );
}

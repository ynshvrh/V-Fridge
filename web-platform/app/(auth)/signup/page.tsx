"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Refrigerator, UserPlus, MailCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";

export default function SignUpPage() {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const { signup, login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { message } = await signup(formData.username, formData.email, formData.password);
      toast.success(message ?? "Акаунт створено. Перевірте пошту для підтвердження.");
      setDone(true);
      try {
        await login(formData.email, formData.password);
        router.push("/");
      } catch {
        // Login may legitimately fail if you decide later to gate it behind verified email.
        router.push("/signin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося створити акаунт");
    } finally {
      setLoading(false);
    }
  };

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

        <Card className="rounded-3xl border-border/60 shadow-2xl shadow-primary/5">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-black tracking-tight">Створити акаунт</CardTitle>
            <CardDescription>Кілька секунд — і ваш розумний холодильник готовий</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl text-center font-medium">
                  {error}
                </div>
              )}
              {done && (
                <div className="p-3 text-sm bg-secondary text-secondary-foreground border border-secondary rounded-xl text-center font-medium inline-flex items-center justify-center gap-2 w-full">
                  <MailCheck className="h-4 w-4" />
                  Перевірте пошту — ми надіслали лист підтвердження
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Ім'я користувача
                </Label>
                <Input
                  id="username"
                  placeholder="Як до вас звертатись?"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  placeholder="мінімум 6 символів"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    Створюємо акаунт…
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Створити акаунт
                  </>
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Вже маєте акаунт?{" "}
                <Link href="/signin" className="text-primary hover:underline font-semibold">
                  Увійти
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

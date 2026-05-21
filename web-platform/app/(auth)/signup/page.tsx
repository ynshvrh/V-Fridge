"use client";

import { useState } from "react";
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
import { useAuth } from "@/providers/auth-provider";

export default function SignUpPage() {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signup(formData.username, formData.email, formData.password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create the account");
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

        {done ? (
          <Card className="rounded-3xl border-border/60 shadow-2xl shadow-primary/5">
            <CardHeader className="space-y-2 text-center pb-2">
              <div className="h-14 w-14 rounded-2xl bg-secondary text-secondary-foreground grid place-items-center mx-auto">
                <MailCheck className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tight">Check your inbox</CardTitle>
              <CardDescription>
                We sent an email to <strong className="text-foreground">{formData.email}</strong> with a confirmation button.
                Once you click it, you will be signed in automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <p className="text-xs text-muted-foreground text-center px-4">
                No email yet? Check the Spam folder or wait a few minutes.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-2">
              <Button asChild variant="outline" className="w-full h-11 rounded-xl">
                <Link href="/signin">Already verified? Sign in</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="rounded-3xl border-border/60 shadow-2xl shadow-primary/5">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-black tracking-tight">Create account</CardTitle>
              <CardDescription>A few seconds and your smart fridge is ready</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-4">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl text-center font-medium">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Username
                  </Label>
                  <Input
                    id="username"
                    placeholder="What should we call you?"
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
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="at least 6 characters"
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
                      Creating account…
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create account
                    </>
                  )}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/signin" className="text-primary hover:underline font-semibold">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}

"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { apiFetch } from "@/lib/api-client";
import { Trash2, LogOut, ShieldCheck, User, MailCheck, MailWarning } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user, logout } = useAuth();

  const clearData = async (type: "chat" | "products") => {
    const labels = { chat: "messages", products: "products" };
    if (!confirm(`Delete all ${labels[type]}?`)) return;

    try {
      await apiFetch(`/${type}`, { method: "DELETE" });
      toast.success(`${type === "chat" ? "Chat" : "Fridge"} cleared`);
    } catch {
      toast.error("Failed to perform the action");
    }
  };

  const resendVerification = async () => {
    if (!user?.email) return;
    try {
      await apiFetch("/auth/resend-verification", {
        method: "POST",
        body: { email: user.email },
        skipAuth: true,
      });
      toast.success("Verification email sent");
    } catch {
      toast.error("Failed to send the email");
    }
  };

  return (
    <div className="min-h-full w-full p-4 md:p-8 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest">
            <User className="h-3 w-3" />
            Profile
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">Settings</h1>
          <p className="text-base md:text-lg text-muted-foreground font-medium">
            Manage your V-Fridge profile and data.
          </p>
        </header>

        <Separator className="bg-border/60" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <section className="md:col-span-4 space-y-4">
            <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-md shadow-primary/20 text-2xl font-black">
                {(user?.username || user?.email || "?").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h3 className="font-black text-xl tracking-tight">
                  {user?.username || "Guest"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {user?.email || "Email not set"}
                </p>
              </div>
              {user?.emailVerified ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 text-success text-[10px] font-bold uppercase tracking-widest">
                  <MailCheck className="h-3 w-3" />
                  Email verified
                </div>
              ) : (
                <button
                  type="button"
                  onClick={resendVerification}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100 text-[11px] font-bold uppercase tracking-widest hover:bg-yellow-200 transition-colors"
                >
                  <MailWarning className="h-3.5 w-3.5" />
                  Verify email
                </button>
              )}
            </div>
          </section>

          <main className="md:col-span-8 space-y-5">
            <Card className="rounded-3xl border-border/60 shadow-sm bg-card overflow-hidden">
              <CardHeader className="bg-muted/40 pb-4">
                <CardTitle className="text-lg">Personal details</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 grid sm:grid-cols-2 gap-4">
                <div className="space-y-1 p-4 rounded-2xl bg-secondary/30 border border-secondary">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Username
                  </p>
                  <p className="text-base font-bold truncate">
                    {user?.username || "Guest"}
                  </p>
                </div>
                <div className="space-y-1 p-4 rounded-2xl bg-secondary/30 border border-secondary">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Email
                  </p>
                  <p className="text-base font-bold truncate">{user?.email || "—"}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-destructive/20 shadow-sm overflow-hidden">
              <CardHeader className="bg-destructive/5 border-b border-destructive/10 pb-4">
                <CardTitle className="text-lg text-destructive">Danger zone</CardTitle>
                <CardDescription>These actions cannot be undone</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 text-destructive border-destructive/30 hover:bg-destructive hover:text-white rounded-xl"
                  onClick={() => clearData("products")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear products
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-12 text-destructive border-destructive/30 hover:bg-destructive hover:text-white rounded-xl"
                  onClick={() => clearData("chat")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete chat history
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/60 shadow-sm bg-secondary/30">
              <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-success/15">
                    <ShieldCheck className="h-5 w-5 text-success" />
                  </div>
                  <p className="font-semibold text-sm">
                    {user ? "Session active and secure" : "Not signed in"}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto px-6 h-11 font-bold rounded-xl shadow-md shadow-destructive/20"
                  onClick={logout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}

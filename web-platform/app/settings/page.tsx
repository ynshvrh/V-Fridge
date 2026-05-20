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
import { useSession, signOut } from "next-auth/react";
import { Trash2, LogOut, ShieldCheck, User, MailCheck } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { data: session } = useSession();

  const clearData = async (type: "chat" | "products") => {
    const labels = { chat: "повідомлення", products: "продукти" };
    if (!confirm(`Видалити всі ${labels[type]}?`)) return;

    try {
      const res = await fetch(`/api/${type}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`${type === "chat" ? "Чат" : "Холодильник"} очищено`);
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Не вдалося виконати дію");
    }
  };

  return (
    <div className="min-h-full w-full p-4 md:p-8 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest">
            <User className="h-3 w-3" />
            Профіль
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">Налаштування</h1>
          <p className="text-base md:text-lg text-muted-foreground font-medium">
            Керуйте профілем та даними вашого V-Fridge.
          </p>
        </header>

        <Separator className="bg-border/60" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <section className="md:col-span-4 space-y-4">
            <div className="p-6 rounded-3xl bg-card border border-border/60 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-md shadow-primary/20 text-2xl font-black">
                {(session?.user?.username || session?.user?.email || "?").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h3 className="font-black text-xl tracking-tight">
                  {session?.user?.username || "Гість"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {session?.user?.email || "Email не вказано"}
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 text-secondary-foreground text-[10px] font-bold uppercase tracking-widest">
                <MailCheck className="h-3 w-3" />
                Email верифіковано
              </div>
            </div>
          </section>

          <main className="md:col-span-8 space-y-5">
            <Card className="rounded-3xl border-border/60 shadow-sm bg-card overflow-hidden">
              <CardHeader className="bg-muted/40 pb-4">
                <CardTitle className="text-lg">Персональні дані</CardTitle>
                <CardDescription>Інформація вашого облікового запису</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 grid sm:grid-cols-2 gap-4">
                <div className="space-y-1 p-4 rounded-2xl bg-secondary/30 border border-secondary">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Юзернейм
                  </p>
                  <p className="text-base font-bold truncate">
                    {session?.user?.username || "Гість"}
                  </p>
                </div>
                <div className="space-y-1 p-4 rounded-2xl bg-secondary/30 border border-secondary">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    Email
                  </p>
                  <p className="text-base font-bold truncate">{session?.user?.email || "—"}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-destructive/20 shadow-sm overflow-hidden">
              <CardHeader className="bg-destructive/5 border-b border-destructive/10 pb-4">
                <CardTitle className="text-lg text-destructive">Небезпечна зона</CardTitle>
                <CardDescription>Ці дії неможливо скасувати</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 text-destructive border-destructive/30 hover:bg-destructive hover:text-white rounded-xl"
                  onClick={() => clearData("products")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Очистити продукти
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-12 text-destructive border-destructive/30 hover:bg-destructive hover:text-white rounded-xl"
                  onClick={() => clearData("chat")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Видалити історію чату
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
                    {session ? "Сесія активна та захищена" : "Авторизація відсутня"}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto px-6 h-11 font-bold rounded-xl shadow-md shadow-destructive/20"
                  onClick={() => signOut({ callbackUrl: "/signin" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Вийти з акаунту
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}

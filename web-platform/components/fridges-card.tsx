"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Refrigerator, UserPlus, Trash2, Loader2, LogOut, Plus, Crown } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";
import { useFridges, type Fridge } from "@/providers/fridge-provider";

type DeleteFridgeResponse = {
  success: boolean;
  replacementFridgeId?: number;
  replacementFridgeName?: string;
};

export function FridgesCard() {
  const t = useTranslations();
  const { fridges, status, refresh, active, setActive } = useFridges();
  const loading = status === "loading";
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [inviteFor, setInviteFor] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await apiFetch<Fridge>("/fridges", { method: "POST", body: { name: newName.trim() } });
      setNewName("");
      await refresh();
      toast.success(t("fridgesCreated"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("fridgesCreateFailed")));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (f: Fridge) => {
    if (!confirm(t("fridgesDeleteTitle", { name: f.name }))) return;
    setBusy(f.id);
    try {
      const resp = await apiFetch<DeleteFridgeResponse>(`/fridges/${f.id}`, { method: "DELETE" });
      if (active?.id === f.id) setActive(null); // fall back to the first remaining fridge
      await refresh();
      // Server auto-creates a fresh empty fridge when the caller drops to zero;
      // surface that explicitly so the user knows nothing dropped on the floor.
      if (resp?.replacementFridgeName) {
        toast.success(t("fridgesReplacementToast", { name: resp.replacementFridgeName }));
      } else {
        toast.success(t("fridgesDeleted"));
      }
    } catch (err) {
      toast.error(getErrorMessage(err, t("fridgesDeleteFailed")));
    } finally {
      setBusy(null);
    }
  };

  const handleLeave = async (f: Fridge) => {
    if (!confirm(t("fridgesLeaveTitle", { name: f.name }))) return;
    setBusy(f.id);
    try {
      await apiFetch(`/fridges/${f.id}/members/me`, { method: "DELETE" });
      if (active?.id === f.id) setActive(null);
      await refresh();
      toast.success(t("fridgesLeft"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("fridgesLeaveFailed")));
    } finally {
      setBusy(null);
    }
  };

  const handleInvite = async (fridgeId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setBusy(fridgeId);
    try {
      await apiFetch(`/fridges/${fridgeId}/invites`, {
        method: "POST",
        body: { email: inviteEmail.trim() },
      });
      toast.success(t("fridgesInviteSent", { email: inviteEmail }));
      setInviteEmail("");
      setInviteFor(null);
    } catch (err) {
      toast.error(getErrorMessage(err, t("fridgesInviteFailed")));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="rounded-3xl border-border/60 shadow-sm bg-card overflow-hidden">
      <CardHeader className="bg-muted/40 pb-4">
        <CardTitle className="text-lg inline-flex items-center gap-2">
          <Refrigerator className="h-4 w-4" />
          {t("fridgesTitle")}
        </CardTitle>
        <CardDescription>{t("fridgesHint")}</CardDescription>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ul className="space-y-3">
            {fridges.map((f) => (
              <li key={f.id} className="rounded-2xl border border-border/70 bg-background p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold truncate">{f.name}</p>
                      {f.role === "owner" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-widest font-black rounded-full bg-primary/10 text-primary">
                          <Crown className="h-3 w-3" /> {t("fridgesOwner")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("fridgesMembers", { count: f.memberCount })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {f.role === "owner" ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-lg gap-1.5"
                          onClick={() => setInviteFor(inviteFor === f.id ? null : f.id)}
                        >
                          <UserPlus className="h-3.5 w-3.5" /> {t("fridgesMenuInvite")}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(f)}
                          disabled={busy === f.id}
                          title={t("fridgesMenuDelete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-lg gap-1.5 text-muted-foreground hover:text-destructive"
                        onClick={() => handleLeave(f)}
                        disabled={busy === f.id}
                      >
                        <LogOut className="h-3.5 w-3.5" /> {t("fridgesMenuLeave")}
                      </Button>
                    )}
                  </div>
                </div>

                {inviteFor === f.id && (
                  <form
                    onSubmit={(e) => handleInvite(f.id, e)}
                    className="flex gap-2 pt-2 border-t border-border/60"
                  >
                    <Input
                      type="email"
                      placeholder={t("fridgesInviteHint")}
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      className="h-9 rounded-lg flex-1"
                    />
                    <Button type="submit" disabled={busy === f.id} className="h-9 rounded-lg">
                      {t("actionSend")}
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleCreate} className="flex gap-2 pt-2 border-t border-border/60">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("fridgesNewName")}
            className="h-10 rounded-xl flex-1"
          />
          <Button type="submit" disabled={creating || !newName.trim()} className="h-10 rounded-xl gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t("actionCreate")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

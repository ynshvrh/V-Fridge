"use client";

import { useState } from "react";
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

export function FridgesCard() {
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
      toast.success("Fridge created");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create the fridge"));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (f: Fridge) => {
    if (!confirm(`Delete "${f.name}"? Products and members will be gone.`)) return;
    setBusy(f.id);
    try {
      await apiFetch(`/fridges/${f.id}`, { method: "DELETE" });
      if (active?.id === f.id) setActive(null); // fall back to the first remaining fridge
      await refresh();
      toast.success("Fridge deleted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete"));
    } finally {
      setBusy(null);
    }
  };

  const handleLeave = async (f: Fridge) => {
    if (!confirm(`Leave "${f.name}"?`)) return;
    setBusy(f.id);
    try {
      await apiFetch(`/fridges/${f.id}/members/me`, { method: "DELETE" });
      if (active?.id === f.id) setActive(null);
      await refresh();
      toast.success("Left the fridge");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to leave"));
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
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteFor(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to send invite"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="rounded-3xl border-border/60 shadow-sm bg-card overflow-hidden">
      <CardHeader className="bg-muted/40 pb-4">
        <CardTitle className="text-lg inline-flex items-center gap-2">
          <Refrigerator className="h-4 w-4" />
          Fridges
        </CardTitle>
        <CardDescription>
          Manage shared fridges. Invite household members by email; only owners can rename or delete.
        </CardDescription>
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
                          <Crown className="h-3 w-3" /> Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {f.memberCount} {f.memberCount === 1 ? "member" : "members"}
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
                          <UserPlus className="h-3.5 w-3.5" /> Invite
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(f)}
                          disabled={busy === f.id}
                          title="Delete fridge"
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
                        <LogOut className="h-3.5 w-3.5" /> Leave
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
                      placeholder="invitee@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      className="h-9 rounded-lg flex-1"
                    />
                    <Button type="submit" disabled={busy === f.id} className="h-9 rounded-lg">
                      Send
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
            placeholder="New fridge name…"
            className="h-10 rounded-xl flex-1"
          />
          <Button type="submit" disabled={creating || !newName.trim()} className="h-10 rounded-xl gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

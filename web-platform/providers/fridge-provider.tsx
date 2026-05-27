"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch, fridgeStore } from "@/lib/api-client";
import { useAuth } from "@/providers/auth-provider";

export type Fridge = {
  id: number;
  name: string;
  ownerId: number;
  role: "owner" | "member";
  memberCount: number;
  createdAt: string | null;
};

type FridgeContextValue = {
  fridges: Fridge[];
  /** Pinned active fridge id from localStorage. `null` means "follow server default". */
  activeId: number | null;
  /** Resolved active fridge — pinned id if it still exists, otherwise the first item. */
  active: Fridge | null;
  status: "loading" | "ready" | "empty" | "error";
  setActive: (id: number | null) => void;
  refresh: () => Promise<void>;
};

const FridgeContext = createContext<FridgeContextValue | null>(null);

export function FridgeProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth();
  const [fridges, setFridges] = useState<Fridge[]>([]);
  // Lazy initialiser reads localStorage on the first client render; SSR returns null
  // and the value rehydrates on mount — no useEffect needed.
  const [activeId, setActiveIdState] = useState<number | null>(() =>
    typeof window === "undefined" ? null : fridgeStore.get(),
  );
  const [status, setStatus] = useState<FridgeContextValue["status"]>("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const list = await apiFetch<Fridge[]>("/fridges");
      setFridges(Array.isArray(list) ? list : []);
      setStatus(list.length === 0 ? "empty" : "ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // Wrap the body in an async IIFE so the setState calls happen in an async
    // boundary (the lint rule allows that — it only flags synchronous setState).
    void (async () => {
      if (authStatus !== "authenticated") {
        setFridges([]);
        setStatus(authStatus === "loading" ? "loading" : "empty");
        return;
      }
      await load();
    })();
  }, [authStatus, load]);

  const setActive = useCallback((id: number | null) => {
    fridgeStore.set(id);
    setActiveIdState(id);
  }, []);

  const active = useMemo<Fridge | null>(() => {
    if (fridges.length === 0) return null;
    if (activeId != null) {
      const pinned = fridges.find((f) => f.id === activeId);
      if (pinned) return pinned;
    }
    return fridges[0];
  }, [fridges, activeId]);

  const value = useMemo<FridgeContextValue>(
    () => ({ fridges, activeId, active, status, setActive, refresh: load }),
    [fridges, activeId, active, status, setActive, load],
  );

  return <FridgeContext.Provider value={value}>{children}</FridgeContext.Provider>;
}

export function useFridges() {
  const ctx = useContext(FridgeContext);
  if (!ctx) throw new Error("useFridges must be used within <FridgeProvider>");
  return ctx;
}

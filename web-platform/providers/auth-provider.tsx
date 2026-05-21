"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch, tokenStore, setOnSessionLost, type StoredTokens } from "@/lib/api-client";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  emailVerified: boolean;
};

type TokenPair = StoredTokens & {
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: AuthUser;
};

type AuthContextValue = {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<{ message?: string }>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PROTECTED_PATHS = ["/", "/recipe", "/settings"];
const AUTH_ONLY_GUEST_PATHS = ["/signin", "/signup"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const router = useRouter();
  const pathname = usePathname();

  const handleSessionLost = useCallback(() => {
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    setOnSessionLost(handleSessionLost);
    return () => setOnSessionLost(null);
  }, [handleSessionLost]);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      const tokens = tokenStore.get();
      if (!tokens) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }
      try {
        const me = await apiFetch<AuthUser>("/auth/me");
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) {
          tokenStore.clear();
          setStatus("unauthenticated");
        }
      }
    };
    bootstrap();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" && PROTECTED_PATHS.includes(pathname)) {
      router.replace("/signin");
    } else if (status === "authenticated" && AUTH_ONLY_GUEST_PATHS.includes(pathname)) {
      router.replace("/");
    }
  }, [status, pathname, router]);

  const storePair = useCallback((pair: TokenPair) => {
    tokenStore.set({ accessToken: pair.accessToken, refreshToken: pair.refreshToken });
    setUser(pair.user);
    setStatus("authenticated");
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const pair = await apiFetch<TokenPair>("/auth/login", {
      method: "POST",
      body: { email, password },
      skipAuth: true,
    });
    storePair(pair);
  }, [storePair]);

  const signup = useCallback(async (username: string, email: string, password: string) => {
    const resp = await apiFetch<{ user: AuthUser; message?: string }>("/auth/signup", {
      method: "POST",
      body: { username, email, password },
      skipAuth: true,
    });
    // Signup does not auto-log-in — the user still needs to verify email or sign in explicitly.
    return { message: resp.message };
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const pair = await apiFetch<TokenPair>("/auth/google", {
      method: "POST",
      body: { idToken },
      skipAuth: true,
    });
    storePair(pair);
  }, [storePair]);

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.get()?.refreshToken;
    if (refreshToken) {
      try { await apiFetch("/auth/logout", { method: "POST", body: { refreshToken }, skipAuth: true }); }
      catch { /* best-effort */ }
    }
    tokenStore.clear();
    setUser(null);
    setStatus("unauthenticated");
    router.replace("/signin");
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await apiFetch<AuthUser>("/auth/me");
      setUser(me);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user, status, login, signup, loginWithGoogle, logout, refreshUser,
  }), [user, status, login, signup, loginWithGoogle, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

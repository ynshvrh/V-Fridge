"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch, tokenStore, setOnSessionLost, type StoredTokens } from "@/lib/api-client";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  emailVerified: boolean;
  preferredLanguage: string;
  cuisinePreference: string;
  dietaryProfile?: string;
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
  /** Store a token pair returned by the API directly (e.g. after email verification). */
  applySession: (pair: TokenPair) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PROTECTED_PATHS = ["/", "/recipe", "/settings", "/shopping", "/planner"];
const AUTH_ONLY_GUEST_PATHS = ["/signin", "/signup"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    const cached = localStorage.getItem("vfridge_auth_user");
    return cached ? JSON.parse(cached) : null;
  });
  const [status, setStatus] = useState<AuthContextValue["status"]>(() => {
    if (typeof window === "undefined") return "loading";
    const tokens = tokenStore.get();
    if (!tokens) return "unauthenticated";
    const cachedUser = localStorage.getItem("vfridge_auth_user");
    return cachedUser ? "authenticated" : "loading";
  });
  const router = useRouter();
  const pathname = usePathname();

  const handleSessionLost = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("vfridge_auth_user");
    }
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
        if (!cancelled) {
          localStorage.removeItem("vfridge_auth_user");
          setStatus("unauthenticated");
        }
        return;
      }
      try {
        const me = await apiFetch<AuthUser>("/auth/me");
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
          localStorage.setItem("vfridge_auth_user", JSON.stringify(me));
        }
      } catch {
        if (!cancelled) {
          tokenStore.clear();
          localStorage.removeItem("vfridge_auth_user");
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
    if (typeof window !== "undefined") {
      localStorage.setItem("vfridge_auth_user", JSON.stringify(pair.user));
    }
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
    if (typeof window !== "undefined") {
      localStorage.removeItem("vfridge_auth_user");
    }
    setUser(null);
    setStatus("unauthenticated");
    router.replace("/signin");
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await apiFetch<AuthUser>("/auth/me");
      setUser(me);
      setStatus("authenticated");
      if (typeof window !== "undefined") {
        localStorage.setItem("vfridge_auth_user", JSON.stringify(me));
      }
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("vfridge_auth_user");
      }
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user, status, login, signup, loginWithGoogle, applySession: storePair, logout, refreshUser,
  }), [user, status, login, signup, loginWithGoogle, storePair, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

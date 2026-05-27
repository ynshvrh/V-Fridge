"use client";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5080").replace(/\/$/, "");

const ACCESS_KEY = "vf_access_token";
const REFRESH_KEY = "vf_refresh_token";
const FRIDGE_KEY = "vf_active_fridge_id";

export type StoredTokens = { accessToken: string; refreshToken: string };

export const tokenStore = {
  get(): StoredTokens | null {
    if (typeof window === "undefined") return null;
    const accessToken = window.localStorage.getItem(ACCESS_KEY);
    const refreshToken = window.localStorage.getItem(REFRESH_KEY);
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  },
  set(tokens: StoredTokens) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(FRIDGE_KEY);
  },
};

/**
 * Active-fridge selection. Persisted in localStorage so the choice survives
 * page reloads; sent as `X-Fridge-Id` on every authenticated request — the
 * server uses it to scope products / shopping / chat to one fridge.
 */
export const fridgeStore = {
  get(): number | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(FRIDGE_KEY);
    if (!raw) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  },
  set(id: number | null) {
    if (typeof window === "undefined") return;
    if (id == null) window.localStorage.removeItem(FRIDGE_KEY);
    else window.localStorage.setItem(FRIDGE_KEY, String(id));
  },
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public payload?: unknown) {
    super(message);
  }
}

type FetchOptions = Omit<RequestInit, "body"> & { body?: unknown; skipAuth?: boolean };

let refreshPromise: Promise<StoredTokens | null> | null = null;
let onSessionLost: (() => void) | null = null;

export function setOnSessionLost(handler: (() => void) | null) {
  onSessionLost = handler;
}

async function performRefresh(): Promise<StoredTokens | null> {
  const tokens = tokenStore.get();
  if (!tokens) return null;

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: tokens.refreshToken }),
  });

  if (!res.ok) {
    tokenStore.clear();
    onSessionLost?.();
    return null;
  }

  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  const fresh = { accessToken: data.accessToken, refreshToken: data.refreshToken };
  tokenStore.set(fresh);
  return fresh;
}

function refreshOnce(): Promise<StoredTokens | null> {
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function apiFetch<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { skipAuth, body, headers, ...rest } = opts;

  const buildHeaders = (token?: string): HeadersInit => {
    const h: Record<string, string> = { Accept: "application/json", ...(headers as Record<string, string>) };
    if (body !== undefined && !(body instanceof FormData)) h["Content-Type"] ??= "application/json";
    if (token) h["Authorization"] = `Bearer ${token}`;
    // Scope reads/writes to the active fridge when one is pinned. Unauthenticated
    // requests (signup, login, refresh) skip the header — they target /auth which
    // does not consult fridge context.
    if (token) {
      const fridgeId = fridgeStore.get();
      if (fridgeId != null && !("X-Fridge-Id" in h)) {
        h["X-Fridge-Id"] = String(fridgeId);
      }
    }
    return h;
  };

  const send = async (token?: string) =>
    fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: buildHeaders(token),
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });

  const token = skipAuth ? undefined : tokenStore.get()?.accessToken;
  let res = await send(token);

  if (res.status === 401 && !skipAuth && tokenStore.get()) {
    const fresh = await refreshOnce();
    if (fresh) res = await send(fresh.accessToken);
  }

  if (!res.ok) {
    let payload: unknown;
    try { payload = await res.json(); } catch { /* not JSON */ }
    const errorMessage =
      (payload && typeof payload === "object" && "error" in payload && typeof (payload as { error: unknown }).error === "string")
        ? (payload as { error: string }).error
        : `Request failed with ${res.status}`;
    throw new ApiError(res.status, errorMessage, payload);
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") ?? "";
  return (contentType.includes("application/json") ? await res.json() : ((await res.text()) as unknown)) as T;
}

export const API_URL = API_BASE;

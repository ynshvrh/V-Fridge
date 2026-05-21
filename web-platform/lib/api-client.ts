"use client";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5080").replace(/\/$/, "");

const ACCESS_KEY = "vf_access_token";
const REFRESH_KEY = "vf_refresh_token";

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
    return h;
  };

  const send = async (token?: string) =>
    fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: buildHeaders(token),
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });

  let token = skipAuth ? undefined : tokenStore.get()?.accessToken;
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

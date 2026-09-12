// src/hooks/swr/api-client.tsx
'use client';

import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { SWRConfig, useSWRConfig } from 'swr';

/**
 * ----------------------------------------------------------------------------
 * TIMEOUTS & RETRIES
 * ----------------------------------------------------------------------------
 * Without a timeout a hung request never settles, and AuthProvider keeps its
 * full-screen spinner until the browser gives up (Sentry showed ~440 users/week
 * whose `/users/me` never finished). Only SWR reads (the `fetcher`) and the
 * token refresh get one — direct `api.post`/`api.get` calls (uploads, exports)
 * keep axios' no-timeout default so a slow upload is not cut off.
 */

export const READ_TIMEOUT_MS = 20_000;
const REFRESH_TIMEOUT_MS = 20_000;
// Delay before each retry of a transient read failure (so 3 attempts in total).
export const READ_RETRY_DELAYS_MS = [1_000, 3_000];

/**
 * ----------------------------------------------------------------------------
 * AXIOS CLIENTS
 * ----------------------------------------------------------------------------
 * We keep two axios instances:
 *  - `api`:     the main client (has interceptors for auth + 401 refresh)
 *  - `apiRefresh`: a minimal client WITHOUT interceptors (used to refresh token)
 * This avoids infinite interceptor loops when refresh endpoints themselves 401.
 */

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACK_API_URL,
  withCredentials: true, // send cookies (e.g., refresh token in httpOnly cookie)
});

const apiRefresh = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACK_API_URL,
  withCredentials: true,
  // Every request that needs a token waits on this call, so it must not hang forever.
  timeout: REFRESH_TIMEOUT_MS,
});

/**
 * ----------------------------------------------------------------------------
 * TOKEN STORAGE (IN-MEMORY)
 * ----------------------------------------------------------------------------
 * We store the access token in memory for quick header injection.
 * If you need cross-tab sync, consider BroadcastChannel or storage events.
 */

let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

export const clearAccessToken = () => {
  accessToken = null;
};

/**
 * ----------------------------------------------------------------------------
 * SINGLE-FLIGHT REFRESH
 * ----------------------------------------------------------------------------
 * Everyone who needs a fresh access token awaits the same in-flight
 * `/auth/refresh-token` call, so N concurrent 401s (or N first-load requests)
 * cost one refresh. This prevents a refresh storm.
 */

const MISSING_TOKEN_MESSAGE = 'Failed to refresh token';

let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    // Important: use apiRefresh (NO interceptors) to avoid infinite loops
    refreshPromise = apiRefresh
      .post('/auth/refresh-token')
      .then((resp) => {
        const newToken: string | undefined = resp.data?.data?.accessToken;
        if (!newToken) throw new Error(MISSING_TOKEN_MESSAGE);
        setAccessToken(newToken);
        return newToken;
      })
      .catch((error) => {
        clearAccessToken();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

/**
 * ----------------------------------------------------------------------------
 * SESSION BOOTSTRAP (skip the 401 round trip on a hard load)
 * ----------------------------------------------------------------------------
 * The access token lives in memory only, so every full page load starts
 * without one. The first request used to go out bare, get a 401, refresh, then
 * retry — three serial round trips before AuthProvider could leave its
 * spinner. Once bootstrap is on, the first request refreshes up front and the
 * requests made meanwhile wait for that same refresh. It runs at most once per
 * page load: if it fails, requests go out bare and the 401 path below still
 * refreshes, exactly as before.
 *
 * Opt-in (turned on by AuthProvider) rather than global on purpose. The original
 * reason was the `(Shop)` buyer checkout, which rendered without AuthProvider and
 * identified the buyer by their own cookie — a merchant who happened to be logged
 * in must never have their access token attached there. That page has since been
 * retired, but the opt-in stays: any future AuthProvider-less surface gets the
 * safe default, and flipping it to global would change the boot sequence this
 * bootstrap was added to fix.
 */

let sessionBootstrapEnabled = false;
let sessionBootstrap: Promise<unknown> | null = null;

export const enableSessionBootstrap = () => {
  sessionBootstrapEnabled = true;
};

// Login/OTP/refresh/lead endpoints manage the session themselves.
const isAuthEndpoint = (url?: string) => /(^|\/)auth\//.test(url ?? '');

/**
 * `_retry`: this request already went through the 401 refresh once.
 * `_callerAuth`: the caller set its own Authorization header — we neither
 * replace it nor refresh on its behalf.
 */
type ClientRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _callerAuth?: boolean;
};

/**
 * ----------------------------------------------------------------------------
 * REQUEST INTERCEPTOR
 * ----------------------------------------------------------------------------
 * Attaches Authorization header if an access token exists.
 * Axios v1 uses AxiosHeaders; we build a new AxiosHeaders instance to be safe.
 */

api.interceptors.request.use(
  async (config) => {
    const cfg = config as ClientRequestConfig;
    const headers = AxiosHeaders.from(cfg.headers);

    // Decided on the first pass only; a 401 retry re-enters with our own header set.
    if (cfg._callerAuth === undefined) cfg._callerAuth = headers.has('Authorization');

    if (!cfg._callerAuth) {
      if (!accessToken && sessionBootstrapEnabled && !isAuthEndpoint(cfg.url)) {
        // A failed bootstrap is fine: the request goes out bare and the 401 path retries.
        sessionBootstrap ??= refreshAccessToken().catch(() => undefined);
        await sessionBootstrap;
      }
      if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    }

    cfg.headers = headers;
    return cfg;
  },
  (error) => Promise.reject(error),
);

/**
 * ----------------------------------------------------------------------------
 * RESPONSE INTERCEPTOR (401 HANDLING + REFRESH)
 * ----------------------------------------------------------------------------
 * On 401 (once per request, and never for caller-authenticated requests):
 *  - If a refresh already finished while this request was in flight, resend it
 *    with the new token.
 *  - Otherwise refresh (joining any in-flight refresh) and resend.
 */

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = (error.config || {}) as ClientRequestConfig;

    if (error.response?.status !== 401 || originalRequest._retry || originalRequest._callerAuth) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    const sentAuthorization = AxiosHeaders.from(originalRequest.headers).get('Authorization');
    if (accessToken && sentAuthorization !== `Bearer ${accessToken}`) {
      // The request interceptor attaches the current token on the resend.
      return api(originalRequest);
    }

    try {
      await refreshAccessToken();
      return api(originalRequest);
    } catch (refreshError) {
      // A refresh that answered without a token surfaces as the original 401, as before.
      const noToken =
        refreshError instanceof Error && refreshError.message === MISSING_TOKEN_MESSAGE;
      return Promise.reject(noToken ? error : refreshError);
    }
  },
);

/**
 * ----------------------------------------------------------------------------
 * SWR FETCHER
 * ----------------------------------------------------------------------------
 * A flexible fetcher for SWR that supports:
 *   - string keys: "/contacts?page=1&limit=30"
 *   - tuple keys:  ["/contacts", { params: { page, limit, search } }]
 *
 * Reads get READ_TIMEOUT_MS and are retried on transient failures only — no
 * response at all (network drop, timeout) or a 502/503/504 from the edge —
 * which is what a flaky mobile/VPN link or an nginx upstream blip looks like.
 * A 4xx or a 500 is an answer, not a blip, and is returned at once.
 *
 * SWR v2 may pass an AbortSignal in config; axios supports `signal`.
 */

const TRANSIENT_STATUSES = new Set([502, 503, 504]);
const TRANSIENT_CODES = new Set(['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT']);

export const isTransientError = (error: unknown) => {
  if (axios.isCancel(error)) return false;
  const { response, code } = error as AxiosError;
  if (response) return TRANSIENT_STATUSES.has(response.status);
  return TRANSIENT_CODES.has(code ?? '');
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetcher = async <T = unknown,>(
  key: string | [string, AxiosRequestConfig],
): Promise<T> => {
  const [url, cfg] = Array.isArray(key) ? key : [key];

  for (let attempt = 0; ; attempt++) {
    try {
      const res = await api.request<T>({
        url,
        method: 'GET',
        timeout: READ_TIMEOUT_MS,
        ...cfg,
        // SWR passes an AbortSignal in config.signal; axios will cancel the request
        signal: (cfg as any)?.signal,
      });

      // For 204 (No Content) endpoints, axios returns no data; cast is safe for T | undefined.
      return res.data as T;
    } catch (error) {
      if (attempt >= READ_RETRY_DELAYS_MS.length || !isTransientError(error)) throw error;
      await wait(READ_RETRY_DELAYS_MS[attempt]);
    }
  }
};

/**
 * ----------------------------------------------------------------------------
 * SWR PROVIDER
 * ----------------------------------------------------------------------------
 * Set reasonable defaults for admin dashboards:
 *  - No revalidate on focus (avoid flicker when switching tabs)
 *  - Keep previous data during pagination transitions
 *  - Dedup short-burst requests
 *  - No SWR-level retry: the fetcher already retries transient failures
 */

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        revalidateIfStale: true,
        keepPreviousData: true,
        dedupingInterval: 500,
        shouldRetryOnError: false,
        onError: (err) => {
          // Centralized logging hook; integrate with a toast/monitoring if desired
          console.error('SWR Error:', err);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}

/**
 * ----------------------------------------------------------------------------
 * LOGOUT HELPER
 * ----------------------------------------------------------------------------
 * Calls server logout, clears access token, and invalidates SWR cache.
 * You can scope invalidation by filtering keys inside mutate if needed.
 */

export function useLogout() {
  const { mutate } = useSWRConfig();

  return async () => {
    try {
      await api.delete('/auth/logout');
      clearAccessToken();
      await mutate(() => true, undefined, { revalidate: false });
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };
}

export default api;

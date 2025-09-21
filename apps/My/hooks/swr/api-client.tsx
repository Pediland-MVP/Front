"use client";

import axios, { AxiosError, AxiosHeaders, AxiosRequestConfig } from "axios";
import { SWRConfig, useSWRConfig } from "swr";

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
 * REFRESH QUEUE
 * ----------------------------------------------------------------------------
 * While a refresh is in-flight, subsequent 401s wait in a queue (Promise)
 * and are retried once the refresh completes. This prevents a refresh storm.
 */

type QueueItem = {
  resolve: (token?: string | null) => void;
  reject: (err: any) => void;
};

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

/** Resolve/reject all queued requests after refresh finishes. */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

/**
 * ----------------------------------------------------------------------------
 * REQUEST INTERCEPTOR
 * ----------------------------------------------------------------------------
 * Attaches Authorization header if an access token exists.
 * Axios v1 uses AxiosHeaders; we build a new AxiosHeaders instance to be safe.
 */

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      const headers = new AxiosHeaders(config.headers);
      headers.set("Authorization", `Bearer ${accessToken}`);
      config.headers = headers;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Add a local _retry flag to the request config so we don't refresh twice.
 */
type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

/**
 * ----------------------------------------------------------------------------
 * RESPONSE INTERCEPTOR (401 HANDLING + REFRESH)
 * ----------------------------------------------------------------------------
 * On 401:
 *  - If a refresh is already happening, queue the request and retry later.
 *  - Otherwise, mark this request as _retry, refresh the token with apiRefresh,
 *    update the Authorization header, and retry the original request.
 */

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = (error.config || {}) as RetriableConfig;

    // Only handle 401s for requests that haven't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If refresh is in-flight, push this request to the queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          // When refresh resolves, update header (if we received a token) and retry
          // Note: AxiosHeaders supports .set(), but here we keep object form for brevity
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          };
          return api(originalRequest);
        });
      }

      // Start refresh flow for this first 401
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Important: use apiRefresh (NO interceptors) to avoid infinite loops
        const resp = await apiRefresh.post("/auth/refresh-token");
        const newToken: string | undefined = resp.data?.data?.accessToken;

        if (!newToken) {
          // Refresh failed (malformed or missing token in response)
          processQueue(new Error("Failed to refresh token"));
          clearAccessToken();
          window.location.href = "/auth/signin";
          return Promise.reject(error);
        }

        // Store new token and release the waiting queue
        setAccessToken(newToken);
        processQueue(null, newToken);

        // Ensure the original request uses the fresh token
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newToken}`,
        };

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh request itself failed: reject all queued and redirect
        processQueue(refreshError as any);
        clearAccessToken();
        window.location.href = "/auth/signin";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Non-401 or already retried: bubble up
    return Promise.reject(error);
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
 * SWR v2 may pass an AbortSignal in config; axios supports `signal`.
 */

export const fetcher = async <T = unknown,>(
  key: string | [string, AxiosRequestConfig],
): Promise<T> => {
  const [url, cfg] = Array.isArray(key) ? key : [key];
  const res = await api.request<T>({
    url,
    method: "GET",
    ...cfg,
    // SWR passes an AbortSignal in config.signal; axios will cancel the request
    signal: (cfg as any)?.signal,
  });

  // For 204 (No Content) endpoints, axios returns no data; cast is safe for T | undefined.
  return res.data as T;
};

/**
 * ----------------------------------------------------------------------------
 * SWR PROVIDER
 * ----------------------------------------------------------------------------
 * Set reasonable defaults for admin dashboards:
 *  - No revalidate on focus (avoid flicker when switching tabs)
 *  - Keep previous data during pagination transitions
 *  - Dedup short-burst requests
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
          console.error("SWR Error:", err);
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
      await api.post("/auth/logout");
      clearAccessToken();
      // Invalidate everything in SWR cache (no revalidate)
      await mutate(() => true, undefined, { revalidate: false });
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  };
}

export default api;

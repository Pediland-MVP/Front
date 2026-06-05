// src/hooks/swr/api-client.tsx
"use client";

import axios from "axios";
import { SWRConfig, useSWRConfig } from "swr";

// Create an axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACK_API_URL,
  withCredentials: true, // Important for cookies
});

// In-memory token storage
let accessToken: string | null = null;

// Track if a token refresh is in progress
type FailedRequest = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

// Process the queue of failed requests
const processQueue = (error: unknown, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Set the access token in memory
export const setAccessToken = (token: string) => {
  accessToken = token;
};

// Get the current access token
export const getAccessToken = () => {
  return accessToken;
};

// Clear the access token from memory
export const clearAccessToken = () => {
  accessToken = null;
};

// Request interceptor to add the Authorization header
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for handling 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If a refresh is already in progress, add this request to the queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call your refresh token endpoint (refresh token is in HTTP-only cookie)
        const response = await api.post("/auth/refresh-token");

        if (response.data?.data?.accessToken) {
          // Store the new access token in memory
          setAccessToken(response.data.data.accessToken);

          // Process all the requests that failed while refreshing
          processQueue(null, response.data.data.accessToken);
          return api(originalRequest);
        } else {
          processQueue(new Error("Failed to refresh token"));
          // Clear token and redirect to login
          clearAccessToken();
          window.location.href = "/auth/signin";
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError);
        // Clear token and redirect to login
        clearAccessToken();
        window.location.href = "/auth/signin";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// Fetch function for SWR that uses our axios instance
export const fetcher = async (url: string, options = {}) => {
  try {
    const { data } = await api({
      url,
      ...options,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

// Custom SWR provider with our settings
export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        shouldRetryOnError: false,
        revalidateOnFocus: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}

// Helper hook to clear SWR cache on logout
export function useLogout() {
  const { mutate } = useSWRConfig();

  return async () => {
    try {
      await api.post("/auth/logout");
      // Clear the access token
      clearAccessToken();
      // Clear all SWR cache
      await mutate("/auth/me", null, { revalidate: false }); // Added by Pedram
      mutate(() => true, undefined, { revalidate: false });
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  };
}

export default api;

"use client";

import useSWR from "swr";
import { getAccessToken } from "./swr/api-client";
import { UserNamespace } from "@/types/user";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

export default function useUser() {
  const { data, error, isLoading, mutate } =
    useSWR<UserNamespace.GET.User>("/users/me");
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (data) {
      setAuth({
        isLoggedIn: true,
        isOnboarding: data.status === "onboarding",
        isConnected: Boolean(data.instagrams?.length),
      });
    }
  }, [data, setAuth]);

  return {
    error,
    hasInstagram: Boolean(data?.instagrams?.length),
    hasSubscription: Boolean(data?.subscriptions?.length),
    isAuthenticated: !!getAccessToken(),
    isError: !!error,
    isLoading,
    mutate,
    status: data?.status,
    user: data,
  };
}

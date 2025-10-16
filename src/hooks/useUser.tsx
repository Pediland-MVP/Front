"use client";

import useSWR from "swr";
import { getAccessToken } from "./swr/api-client";
import { UserNamespace } from "@/types/user";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

export default function useUser() {
  const { data, error, isLoading, mutate } =
    useSWR<UserNamespace.GET.User>("/users/me");
  const { setIsLoggedIn } = useAuthStore();

  useEffect(() => {
    if (data) {
      setIsLoggedIn(true);
    } else if (error) {
      setIsLoggedIn(false);
    }
  }, [data, error, setIsLoggedIn]);

  return {
    error,
    hasInstagram: Boolean(data?.instagrams?.length),
    hasSubscription: Boolean(data?.subscriptions?.length),
    isAuthenticated: !!data && !error, // Only authenticated if we have user data and no error
    isError: !!error,
    isLoading,
    mutate,
    status: data?.status,
    user: data,
  };
}

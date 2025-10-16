"use client";

import useSWR from "swr";
import { UserNamespace } from "@/types/user";
import { useEffect } from "react";

export default function useUser() {
  const { data, error, isLoading, mutate } =
    useSWR<UserNamespace.GET.User>("/users/me");

  return {
    error,
    isOnboarding: data?.status === 'onboarding',
    hasInstagram: Boolean(data?.instagrams?.length),
    hasSubscription: Boolean(data?.subscriptions?.length),
    isAuthenticated: !!data && !error, // Only authenticated if we have user data and no error
    isError: !!error,
    isLoading: !data && !error,
    mutate,
    status: data?.status,
    user: data,
  };
}

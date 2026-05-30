"use client";

import useUser from "@/hooks/useUser";
import { fetcher } from "@/hooks/swr/api-client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

import { LoaderSpin } from "../ui-custom/LoaderSpin";

interface AuthProviderProps {
  children: React.ReactNode;
}

type PendingInvitation = { id: string };

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAllowed, setIsAllowed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    error,
    isOnboarding,
    hasInstagram,
    isLoading: isUserLoading,
    user,
  } = useUser();

  // A user is in the "connect flow" when onboarding is done but no Instagram
  // is linked yet. We need to show the invitation picker for this state too
  // (spec State B — already-registered user with a pending invite).
  const isInConnectFlow = !isOnboarding && !hasInstagram && !!user;

  const dismissed =
    typeof window !== "undefined" &&
    sessionStorage.getItem("invitePickerDismissed") === "1";

  // Fetch pending invitations for both onboarding AND connect-flow users.
  const shouldFetchInvitations = (isOnboarding || isInConnectFlow) && !dismissed;

  const { data: pendingRaw, isLoading: isPendingLoading } = useSWR<
    { data?: PendingInvitation[] } | PendingInvitation[]
  >(shouldFetchInvitations ? "/invitations/pending" : null, fetcher);

  const pendingInvitations: PendingInvitation[] = Array.isArray(pendingRaw)
    ? pendingRaw
    : (pendingRaw?.data ?? []);
  const hasPendingInvitations = pendingInvitations.length > 0;

  useEffect(() => {
    if (isUserLoading) return;
    // Hold routing decision while we're still fetching pending invitations
    // to avoid a brief redirect before we know whether to show the picker.
    if (shouldFetchInvitations && isPendingLoading) return;

    if (error) {
      if (error.response?.status >= 500) {
        console.error("Error Server:", error);
        router.push("/not-found?status=server");
        return;
      }

      if (error.code === "ERR_NETWORK") {
        console.error("Error Network:", error);
        router.push("/not-found?status=network");
        return;
      }
    }

    let redirect: string | null = null;

    const isAuthRoute = pathname.startsWith("/auth");
    const isOnboardingPage = pathname === "/auth/onboarding";
    const isInvitationsPickerPage = pathname === "/auth/onboarding/invitations";
    const isConnectPage = pathname === "/connect";
    const isInstagramPage = pathname === "/settings/instagram";

    // Where should the onboarding user land?
    const onboardingDestination =
      hasPendingInvitations && !dismissed
        ? "/auth/onboarding/invitations"
        : "/auth/onboarding";

    // Where should a connect-flow user with pending invitations land?
    // returnTo=connect ensures the picker's Skip button routes back here.
    const connectFlowPickerDest =
      hasPendingInvitations && !dismissed
        ? "/auth/onboarding/invitations?returnTo=/connect"
        : null;

    if (isAuthRoute) {
      if (isOnboardingPage && !isOnboarding) {
        redirect = "/";
      } else if (isInvitationsPickerPage && !isOnboarding && !isInConnectFlow) {
        // Picker is only accessible to onboarding OR connect-flow users
        redirect = "/";
      } else if (
        isOnboardingPage &&
        isOnboarding &&
        hasPendingInvitations &&
        !dismissed
      ) {
        redirect = "/auth/onboarding/invitations";
      } else if (isInvitationsPickerPage && !hasPendingInvitations) {
        redirect = isOnboarding ? "/auth/onboarding" : "/connect";
      } else {
        setIsAllowed(true);
      }
    } else if (isConnectPage) {
      if (isOnboarding) {
        redirect = onboardingDestination;
      } else if (isInConnectFlow && connectFlowPickerDest) {
        // State B: connect-flow user has unreviewed pending invitations
        redirect = connectFlowPickerDest;
      } else {
        setIsAllowed(true);
      }
    } else {
      if (isOnboarding) {
        redirect = onboardingDestination;
      } else if (!hasInstagram) {
        if (isInstagramPage && searchParams.get("code")) {
          setIsAllowed(true);
        } else {
          redirect = "/connect";
        }
      } else {
        setIsAllowed(true);
      }
    }

    if (redirect) router.push(redirect);
  }, [
    isOnboarding,
    isInConnectFlow,
    isUserLoading,
    isPendingLoading,
    shouldFetchInvitations,
    pathname,
    searchParams,
    hasInstagram,
    hasPendingInvitations,
    dismissed,
    error,
    router,
  ]);

  if (!isAllowed) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <LoaderSpin />
      </div>
    );
  }

  return <>{children}</>;
}

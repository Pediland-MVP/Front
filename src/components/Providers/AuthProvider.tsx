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

  // Only fetch pending invitations when the user is in the onboarding state
  // and hasn't explicitly dismissed the picker in this session.
  const dismissed =
    typeof window !== "undefined" &&
    sessionStorage.getItem("invitePickerDismissed") === "1";

  const { data: pendingRaw, isLoading: isPendingLoading } = useSWR<
    { data?: PendingInvitation[] } | PendingInvitation[]
  >(isOnboarding && !dismissed ? "/invitations/pending" : null, fetcher);

  const pendingInvitations: PendingInvitation[] = Array.isArray(pendingRaw)
    ? pendingRaw
    : (pendingRaw?.data ?? []);
  const hasPendingInvitations = pendingInvitations.length > 0;

  useEffect(() => {
    if (isUserLoading) return;
    // If we're in onboarding and waiting on pending-invitations, hold off on
    // the redirect decision until that completes — otherwise we'd briefly
    // route the user to /auth/onboarding then bounce them to the picker.
    if (isOnboarding && !dismissed && isPendingLoading) return;

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
    const isInvitationsPickerPage =
      pathname === "/auth/onboarding/invitations";
    const isConnectPage = pathname === "/connect";
    const isInstagramPage = pathname === "/settings/instagram";

    // Where should the onboarding user be?
    const onboardingDestination =
      hasPendingInvitations && !dismissed
        ? "/auth/onboarding/invitations"
        : "/auth/onboarding";

    if (isAuthRoute) {
      if (isOnboardingPage && !isOnboarding) {
        redirect = "/";
      } else if (isInvitationsPickerPage && !isOnboarding) {
        redirect = "/";
      } else if (
        isOnboardingPage &&
        isOnboarding &&
        hasPendingInvitations &&
        !dismissed
      ) {
        // User landed on the plain onboarding form but actually has invitations
        // and hasn't dismissed the picker — bounce them to the picker.
        redirect = "/auth/onboarding/invitations";
      } else if (isInvitationsPickerPage && !hasPendingInvitations) {
        // Defensive — should not happen, but if it does, fall back.
        redirect = "/auth/onboarding";
      } else {
        setIsAllowed(true);
      }
    } else if (isConnectPage) {
      if (searchParams.get("code")) {
        setIsAllowed(true);
      } else if (hasInstagram) {
        redirect = "/";
      } else if (isOnboarding) {
        redirect = onboardingDestination;
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
    isUserLoading,
    isPendingLoading,
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

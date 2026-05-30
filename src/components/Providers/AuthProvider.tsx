"use client";

import useUser from "@/hooks/useUser";
import { fetcher } from "@/hooks/swr/api-client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

  // Track which pathname we last computed routing for. If the pathname changed
  // but we haven't yet re-run the routing effect, isAllowed should be false so
  // we don't flash the previous page's content during the transition.
  const lastRoutedPath = useRef<string | null>(null);

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

  // Read once per render. A navigation (pathname change) triggers a re-render,
  // so this correctly reflects the sessionStorage value after skip/dismiss.
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

  // When the pathname changes, immediately drop the isAllowed flag so we never
  // render a previous page's content while the new route's redirect decision is
  // being computed.
  useEffect(() => {
    setIsAllowed(false);
    lastRoutedPath.current = null;
  }, [pathname]);

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

    // Where should an onboarding user land?
    const onboardingDestination =
      hasPendingInvitations && !dismissed
        ? "/auth/onboarding/invitations"
        : "/auth/onboarding";

    // Where should a connect-flow user with pending invitations land?
    // `returnTo=/connect` ensures the picker's Skip button routes back here.
    const connectFlowPickerDest =
      isInConnectFlow && hasPendingInvitations && !dismissed
        ? "/auth/onboarding/invitations?returnTo=/connect"
        : null;

    if (isAuthRoute) {
      if (isOnboardingPage && !isOnboarding) {
        // A non-onboarding user has no business on the plain onboarding form.
        redirect = "/";
      } else if (isInvitationsPickerPage && !isOnboarding && !isInConnectFlow) {
        // Picker is only reachable during onboarding OR the connect-flow State B.
        // Any other authenticated user who lands here gets sent home.
        redirect = "/";
      } else if (
        isOnboardingPage &&
        isOnboarding &&
        hasPendingInvitations &&
        !dismissed
      ) {
        // Onboarding user landed on the plain form but has pending invitations
        // and hasn't dismissed the picker yet — bounce them to the picker.
        redirect = "/auth/onboarding/invitations";
      } else if (isInvitationsPickerPage && !hasPendingInvitations) {
        // Picker with no invitations to show — send user to the right next step.
        redirect = isOnboarding ? "/auth/onboarding" : "/connect";
      } else {
        setIsAllowed(true);
      }
    } else if (isConnectPage) {
      if (isOnboarding) {
        redirect = onboardingDestination;
      } else if (connectFlowPickerDest) {
        // State B: connect-flow user has unreviewed pending invitations.
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

    if (redirect) {
      router.push(redirect);
    } else {
      lastRoutedPath.current = pathname;
    }
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

  // Show spinner until routing is resolved for the current path.
  if (!isAllowed || lastRoutedPath.current !== pathname) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <LoaderSpin />
      </div>
    );
  }

  return <>{children}</>;
}

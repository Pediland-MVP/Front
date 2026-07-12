'use client';

import useUser from '@/hooks/useUser';
import { fetcher } from '@/hooks/swr/api-client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

import { LoaderSpin } from '../ui-custom/LoaderSpin';

interface AuthProviderProps {
  children: React.ReactNode;
}

type PendingInvitation = { id: string };
type PendingTransfer = { id: string };

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAllowed, setIsAllowed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track which pathname we last computed routing for. If the pathname changed
  // but we haven't yet re-run the routing effect, isAllowed should be false so
  // we don't flash the previous page's content during the transition.
  const lastRoutedPath = useRef<string | null>(null);
  const lastRedirect = useRef<string | null>(null);

  const { error, isOnboarding, hasInstagram, isLoading: isUserLoading, user } = useUser();

  // A user is in the "connect flow" when onboarding is done but no Instagram
  // is linked yet. We need to show the invitation picker for this state too
  // (spec State B — already-registered user with a pending invite).
  const isInConnectFlow = !isOnboarding && !hasInstagram && !!user;

  // Read once per render. A navigation (pathname change) triggers a re-render,
  // so this correctly reflects the sessionStorage value after skip/dismiss.
  const dismissed =
    typeof window !== 'undefined' && sessionStorage.getItem('invitePickerDismissed') === '1';

  // Fetch pending invitations for both onboarding AND connect-flow users.
  const shouldFetchInvitations = (isOnboarding || isInConnectFlow) && !dismissed;

  const { data: pendingRaw, isLoading: isPendingLoading } = useSWR<
    { data?: PendingInvitation[] } | PendingInvitation[]
  >(shouldFetchInvitations ? '/invitations/pending' : null, fetcher);

  const pendingInvitations: PendingInvitation[] = Array.isArray(pendingRaw)
    ? pendingRaw
    : (pendingRaw?.data ?? []);
  const hasPendingInvitations = pendingInvitations.length > 0;

  const dismissedTransfer =
    typeof window !== 'undefined' && sessionStorage.getItem('ownershipTransferDismissed') === '1';

  // Ownership transfer recipients must already be registered, verified users
  // (see backend `initiate()`), so this only applies to connect-flow (State B)
  // users — not the onboarding form, which runs before a name/account exists.
  const shouldFetchTransfers = isInConnectFlow && !dismissedTransfer;

  const { data: transferRaw, isLoading: isTransferLoading } = useSWR<
    { data?: PendingTransfer[] } | PendingTransfer[]
  >(shouldFetchTransfers ? '/ownership-transfers/incoming' : null, fetcher);

  const pendingTransfers: PendingTransfer[] = Array.isArray(transferRaw)
    ? transferRaw
    : (transferRaw?.data ?? []);
  const hasPendingTransfers = pendingTransfers.length > 0;

  // When the pathname changes, immediately drop the isAllowed flag so we never
  // render a previous page's content while the new route's redirect decision is
  // being computed.
  useEffect(() => {
    // Intentionally left empty: we no longer drop isAllowed on pathname change.
    // Unmounting children during a soft navigation breaks the Next.js App Router.
  }, [pathname]);

  useEffect(() => {
    if (isUserLoading) return;
    // Hold routing decision while we're still fetching pending invitations
    // to avoid a brief redirect before we know whether to show the picker.
    if (shouldFetchInvitations && isPendingLoading) return;
    if (shouldFetchTransfers && isTransferLoading) return;

    if (error) {
      if (error.response?.status >= 500) {
        console.error('Error Server:', error);
        router.push('/not-found?status=server');
        return;
      }

      if (error.code === 'ERR_NETWORK') {
        console.error('Error Network:', error);
        router.push('/not-found?status=network');
        return;
      }
    }

    let redirect: string | null = null;

    const isAuthRoute = pathname.startsWith('/auth');
    const isOnboardingPage = pathname === '/auth/onboarding';
    const isInvitationsPickerPage = pathname === '/auth/onboarding/invitations';
    const isTransferPickerPage = pathname === '/auth/onboarding/transfer';
    const isConnectPage = pathname === '/connect';
    const isInstagramPage = pathname === '/settings/instagram';

    // Where should an onboarding user land?
    const onboardingDestination =
      hasPendingInvitations && !dismissed ? '/auth/onboarding/invitations' : '/auth/onboarding';

    // Where should a connect-flow user with a pending ownership-transfer land?
    // `returnTo=/connect` ensures the page's Skip button routes back here.
    const connectFlowTransferDest =
      isInConnectFlow && hasPendingTransfers && !dismissedTransfer
        ? '/auth/onboarding/transfer?returnTo=/connect'
        : null;

    // Where should a connect-flow user with pending invitations land?
    // `returnTo=/connect` ensures the picker's Skip button routes back here.
    // Invitations take priority over an ownership-transfer request; once
    // cleared, connectFlowTransferDest is checked next (see below).
    const connectFlowPickerDest =
      isInConnectFlow && hasPendingInvitations && !dismissed
        ? '/auth/onboarding/invitations?returnTo=/connect'
        : null;

    const connectFlowPendingDest = connectFlowPickerDest ?? connectFlowTransferDest;

    if (isAuthRoute) {
      if (isOnboardingPage && !isOnboarding && isInConnectFlow) {
        // User just completed onboarding but hasn't connected Instagram yet.
        // Redirect them to the connect page instead of letting them stay on
        // the onboarding form they already submitted.
        redirect = connectFlowPendingDest ?? '/connect';
      } else if (isOnboardingPage && !isOnboarding && !isInConnectFlow) {
        // A fully set-up user (has Instagram) has no business on the onboarding form.
        redirect = '/';
      } else if (
        (isInvitationsPickerPage || isTransferPickerPage) &&
        !isOnboarding &&
        !isInConnectFlow
      ) {
        // These pages are only reachable during onboarding OR the connect-flow
        // State B. Any other authenticated user who lands here gets sent home.
        redirect = '/';
      } else if (isOnboardingPage && isOnboarding && hasPendingInvitations && !dismissed) {
        // Onboarding user landed on the plain form but has pending invitations
        // and hasn't dismissed the picker yet — bounce them to the picker.
        redirect = '/auth/onboarding/invitations';
      } else if (isInvitationsPickerPage && !hasPendingInvitations) {
        // Picker with no invitations to show — send user to the right next step.
        redirect = isOnboarding ? '/auth/onboarding' : (connectFlowTransferDest ?? '/connect');
      } else if (isTransferPickerPage && !hasPendingTransfers) {
        // Transfer page with nothing to show — transfer flow is connect-only.
        redirect = '/connect';
      } else {
        setIsAllowed(true);
      }
    } else if (isConnectPage) {
      if (isOnboarding) {
        redirect = onboardingDestination;
      } else if (connectFlowPendingDest) {
        // State B: connect-flow user has an unreviewed pending invitation or
        // ownership-transfer request.
        redirect = connectFlowPendingDest;
      } else {
        setIsAllowed(true);
      }
    } else {
      if (isOnboarding) {
        redirect = onboardingDestination;
      } else if (!hasInstagram) {
        if (isInstagramPage && searchParams.get('code')) {
          setIsAllowed(true);
        } else {
          redirect = connectFlowPendingDest ?? '/connect';
        }
      } else {
        setIsAllowed(true);
      }
    }

    if (redirect) {
      // Prevent infinite loops: if we're about to redirect to the same URL
      // that we already redirected to last time, break the cycle.
      if (lastRedirect.current === redirect) {
        setIsAllowed(true);
        lastRoutedPath.current = pathname;
        lastRedirect.current = null;
      } else {
        lastRedirect.current = redirect;
        router.replace(redirect);
      }
    } else {
      lastRedirect.current = null;
      lastRoutedPath.current = pathname;
    }
  }, [
    isOnboarding,
    isInConnectFlow,
    isUserLoading,
    isPendingLoading,
    isTransferLoading,
    shouldFetchInvitations,
    shouldFetchTransfers,
    pathname,
    searchParams,
    hasInstagram,
    hasPendingInvitations,
    hasPendingTransfers,
    dismissed,
    dismissedTransfer,
    error,
    router,
  ]);

  // Show spinner until routing is resolved for the current path.
  if (!isAllowed) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <LoaderSpin />
      </div>
    );
  }

  return <>{children}</>;
}

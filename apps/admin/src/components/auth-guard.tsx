'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loading } from '@/components/loading';

/**
 * Gates the authenticated (main) area. Renders nothing but a loader until we
 * positively know the visitor is authenticated; unauthenticated visitors are
 * redirected to the sign-in page and never see the dashboard.
 *
 * Auth state comes from `useAuth` (GET /auth/me via the axios client, which
 * attempts a token refresh on 401). The refresh token is an http-only cookie
 * scoped to the API subdomain, so it can't be read by a Next middleware here —
 * this client guard is the gate.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading, isAuthenticated, isError } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || isError)) {
      router.replace('/auth/signin');
    }
  }, [isLoading, isAuthenticated, isError, router]);

  if (isLoading || !isAuthenticated || isError) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loading />
      </div>
    );
  }

  return <>{children}</>;
}

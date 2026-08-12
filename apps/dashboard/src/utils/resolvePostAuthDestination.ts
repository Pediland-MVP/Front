import api from '@/hooks/swr/api-client';
import { mutate } from 'swr';

/**
 * Decides where to send the user right after sign-in/sign-up, in one shot —
 * a non-onboarding user goes home; an onboarding user goes straight to the
 * invitation picker if they have a pending invite, or the plain onboarding
 * form otherwise. Never returns '/auth/onboarding' only for AuthProvider to
 * immediately bounce it to '/auth/onboarding/invitations' a moment later.
 */
export async function resolvePostAuthDestination(status: string | undefined): Promise<string> {
  if (status !== 'onboarding') return '/';

  const pending = await api.get('/invitations/pending').catch(() => null);
  const items = pending?.data?.items ?? [];

  if (items.length > 0) {
    // Seed the SWR cache AuthProvider reads from so it doesn't re-fetch and
    // flash a loading state for data we already have.
    mutate('/invitations/pending', pending.data, { revalidate: false });
    return '/auth/onboarding/invitations';
  }

  return '/auth/onboarding';
}

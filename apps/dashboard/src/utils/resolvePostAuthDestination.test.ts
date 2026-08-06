import { describe, it, expect, vi, beforeEach } from 'vitest';

const get = vi.fn();
vi.mock('@/hooks/swr/api-client', () => ({
  default: { get: (...args: unknown[]) => get(...args) },
}));

const mutate = vi.fn();
vi.mock('swr', () => ({ mutate: (...args: unknown[]) => mutate(...args) }));

import { resolvePostAuthDestination } from './resolvePostAuthDestination';

describe('resolvePostAuthDestination', () => {
  beforeEach(() => {
    get.mockReset();
    mutate.mockReset();
  });

  it('sends a non-onboarding user straight home without checking invitations', async () => {
    const dest = await resolvePostAuthDestination('new');

    expect(dest).toBe('/');
    expect(get).not.toHaveBeenCalled();
  });

  it('sends an onboarding user with no pending invitations to the plain onboarding form', async () => {
    get.mockResolvedValue({ data: { items: [], meta: { totalItems: 0 } } });

    const dest = await resolvePostAuthDestination('onboarding');

    expect(get).toHaveBeenCalledWith('/invitations/pending');
    expect(dest).toBe('/auth/onboarding');
    expect(mutate).not.toHaveBeenCalled();
  });

  // This is the exact case the double-redirect bug hit: signing up with a
  // pending invite used to land on /auth/onboarding first, then get bounced
  // to /auth/onboarding/invitations by AuthProvider a moment later.
  it('sends an onboarding user with a pending invitation straight to the picker, in one decision', async () => {
    const payload = { items: [{ id: 'inv-1' }], meta: { totalItems: 1 } };
    get.mockResolvedValue({ data: payload });

    const dest = await resolvePostAuthDestination('onboarding');

    expect(dest).toBe('/auth/onboarding/invitations');
    // Cache is seeded so AuthProvider doesn't re-fetch and flash a loader for
    // data we already have.
    expect(mutate).toHaveBeenCalledWith('/invitations/pending', payload, { revalidate: false });
  });

  it('falls back to the plain onboarding form if the invitations check fails', async () => {
    get.mockRejectedValue(new Error('network error'));

    const dest = await resolvePostAuthDestination('onboarding');

    expect(dest).toBe('/auth/onboarding');
  });
});

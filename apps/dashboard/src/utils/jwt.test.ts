import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@/hooks/swr/api-client', () => ({
  getAccessToken: vi.fn(),
}));

import { getAccessToken } from '@/hooks/swr/api-client';
import { decodeJwtPayload } from './jwt';

function makeToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'none' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

afterEach(() => {
  vi.clearAllMocks();
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC';
});

describe('decodeJwtPayload', () => {
  it('returns workspaceId/userId decoded from the access token', () => {
    (getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue(
      makeToken({ workspaceId: 'ws-1', sub: 'user-1' }),
    );
    expect(decodeJwtPayload()).toEqual({ workspaceId: 'ws-1', userId: 'user-1' });
  });

  it('falls back to the token cookie when no access token is available', () => {
    (getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue(null);
    document.cookie = `token=${makeToken({ workspaceId: 'ws-2', sub: 'user-2' })}`;
    expect(decodeJwtPayload()).toEqual({ workspaceId: 'ws-2', userId: 'user-2' });
  });

  it('returns nulls when there is no token at all', () => {
    (getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue(null);
    expect(decodeJwtPayload()).toEqual({ workspaceId: null, userId: null });
  });

  it('returns nulls when the token is malformed', () => {
    (getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue('not-a-jwt');
    expect(decodeJwtPayload()).toEqual({ workspaceId: null, userId: null });
  });
});

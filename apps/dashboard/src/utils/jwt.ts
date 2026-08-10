import { getAccessToken } from '@/hooks/swr/api-client';

export function decodeJwtPayload(): { workspaceId: string | null; userId: string | null } {
  let token = getAccessToken();

  if (!token && typeof document !== 'undefined') {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; token=`);
    if (parts.length === 2) {
      token = parts.pop()?.split(';').shift() || null;
    }
  }

  if (!token) return { workspaceId: null, userId: null };

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      workspaceId: payload.workspaceId || null,
      userId: payload.sub || null,
    };
  } catch (e) {
    return { workspaceId: null, userId: null };
  }
}

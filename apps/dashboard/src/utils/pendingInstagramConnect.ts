// A one-time-read cookie carrying the username the user typed into
// SetupInstagramDialog, so the /connect page can remind them which
// account to connect after they come back from paying. Purely cosmetic —
// the real subscription-to-page binding is always decided server-side by
// real follower count at connect time, never by this value.
const COOKIE_NAME = 'pending_ig_username';
const MAX_AGE_SECONDS = 30 * 60;

export function setPendingInstagramUsername(username: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(username)}; max-age=${MAX_AGE_SECONDS}; path=/`;
}

export function readAndClearPendingInstagramUsername(): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${COOKIE_NAME}=`);
  if (parts.length !== 2) return null;
  const raw = parts.pop()?.split(';').shift();
  document.cookie = `${COOKIE_NAME}=; max-age=0; path=/`;
  return raw ? decodeURIComponent(raw) : null;
}

# Update: Account Session Management (frontend) - 2026-07-13

Backend reference: `Back/knowledge/updates/2026-07-13-accountSessions.update.md`.

## Problem
Users needed a settings page to see the devices logged into their account and to close
(terminate) unknown sessions.

## Solution
New dashboard page at `/settings/account-session-management` ("نشست‌های فعال حساب"). It lists
the user's active sessions from `GET /auth/sessions`, pins the current device on top, and lets
the user terminate sessions the backend marks as terminable (older than 5 days, not current).

## Changes
- **New route** (`apps/dashboard/src/app/(Console)/settings/account-session-management/`):
  - `page.tsx` — header + loading/empty states + table (wrapped in `LayoutSettings`).
  - `account-sessions-table.tsx` — table with Phosphor device icons
    (`DeviceMobileIcon`/`DesktopIcon`/`DeviceTabletIcon`), "این دستگاه" badge on the current
    session, jalali login time (`toJalaliDateTime`), and a per-row terminate `AlertDialog`.
    When a session is NOT terminable, the action button stays clickable and opens an info
    dialog explaining the reason (current session vs. younger than 5 days) instead of being
    a dead disabled button.
  - `hooks/useAccountSessions.tsx` — `useSWR('/auth/sessions')`.
  - `hooks/useTerminateSession.tsx` — `api.delete('/auth/sessions/:id')` + `t_ec` error toast,
    then `mutate()`.
- **`types/accountSession.ts`** — `AccountSessionNamespace` / `AccountSessionItem`.
- **`components/Settings/SettingsOptions.tsx`** — added nav item (`DevicesIcon`).
- **i18n (`messages/fa.json`, `messages/fa/ErrorCodes.json`)**:
  - `Settings.Navigation.account_sessions`, new `Settings.AccountSessions` block.
  - `ERROR_CODES`: `SESSION_NOT_FOUND`, `CANNOT_TERMINATE_CURRENT_SESSION`,
    `CANNOT_TERMINATE_RECENT_SESSION`.

## Notes
- The terminate button is disabled purely from the backend `canTerminate` flag; the backend
  is the source of truth for the 5-day / not-current / ownership rules.
- English (`en.json`) strings to be translated later per project convention.

## Verification
- Not run here (user tests manually).

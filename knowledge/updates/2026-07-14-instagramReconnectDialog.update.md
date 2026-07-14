# Instagram Reconnect Dialog (2026-07-14)

Moved the always-visible "how to reconnect Instagram" red banner off `/settings/instagram` into a dialog that opens per-account when the user clicks "اتصال مجدد" on that account's card.

## Problem

`/settings/instagram` always rendered a red-background instructional block (`InstagramInvalidDialog`) below the account list whenever any connected page had an invalid token. The block was static page content, not tied to a specific action, and its red styling/placement was not mobile/desktop friendly.

## Solution

- Deleted `components/Console/InstagramInvalidDialog.tsx` (the always-visible red banner) and its now-dangling import in `app/(Console)/layout.tsx`.
- Added `components/Settings/InstagramReconnectDialog.tsx` — a real `Dialog` (no red background), controlled by the parent, showing the connect instructions, the "اتصال مجدد" (relogin) action, "کپی لینک اتصال" copy action, and the "آموزش اتصال به اینستاگرام" help-video trigger for one specific account.
- `components/Settings/InstagramAccounts.tsx`: added `reconnectTarget` state; the reconnect button on each account card now opens the dialog for that account (`setReconnectTarget(instagram)`) instead of navigating straight to Instagram OAuth. `InstagramReconnectDialog` is rendered once, outside the card list.
- `app/(Console)/settings/instagram/page.tsx`: removed the `<InstagramInvalidDialog />` render — the page no longer shows the static banner.
- `messages/fa.json` (`instagramTokenError`): replaced the pluralized `banner_title`/`banner_description` (used for "N disconnected pages") with singular `dialog_title`/`dialog_description`, since the dialog is now always scoped to exactly one account.

## Verification

- `npx tsc --noEmit` in `apps/dashboard`: only pre-existing baseline errors remain; none in the touched files.
- `npx eslint` on all touched files: 0 errors (only a pre-existing unrelated warning in `InstagramAccounts.tsx`).
- Not tested in the browser per explicit request — user will verify manually.

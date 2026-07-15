# Instagram Reconnect Banner — Show All Pages + Bottom Warning (2026-07-11)

Reworks how the `settings/instagram` page behaves when one or more connected pages
have an invalid Instagram token (`isIgTokenValid === false`). Follows the earlier UI
polish in `2026-07-10-instagramSettingsUiPolish.update.md`.

## Problem

The old flow was all-or-nothing and first-account-centric:

- `InstagramAccounts.tsx` did `if (!data[0].isIgTokenValid) return null;` — so the **moment
  the first page was invalid, the whole list vanished**, even when other pages were healthy.
- `InstagramInvalidDialog.tsx` (the warning block) was built around `accounts[0]` only: a
  single title/username, a single per-account delete button. With several disconnected
  pages it named just one and hid the rest.
- The warning was left-aligned in a narrow `max-w-md` stack, not centered on desktop.

Net effect: with 3 pages where 1 is broken, the user lost sight of their 2 working pages
and only saw a warning about one account.

## Solution

New rule for the invalid-token state:

- **The list is always shown** — valid and invalid pages alike. Invalid cards keep their
  own red "نیاز به ورود مجدد" state.
- **Any page invalid:** the reconnect banner shows **below the list**.
- **No page invalid:** list only, no banner.

`InstagramAccounts.tsx` — **removed** the old first-page guard
(`if (!data[0].isIgTokenValid) return null;`) entirely. The grid now renders every page
regardless of token state (the `data.length === 0` empty state still returns early). The
banner never hides the list.

`InstagramInvalidDialog.tsx` — rebuilt as a **centered banner** (`mx-auto max-w-2xl`,
`text-center`, soft `border-destructive/30 bg-red-50/70` card). It now:

- Sources pages from the same SWR `/instagram/accounts` key and the **same predicate**
  (`!isIgTokenValid`) as the cards, so banner and red cards always agree. (Dropped the old
  `useUser()` + `isIgWebhookSubscribed` path — the accounts endpoint/`Account` type does
  not carry webhook status and the cards never reflected it; see Note.)
- Titles by count via ICU plural: 1 page → `اتصال پیج {username} به بفروش قطع شده است.`;
  many → `اتصال این پیج‌ها به بفروش قطع شده است: {usernames}` (comma-joined `@username`s).
- Shows the requested instruction paragraph, then three actions: **اتصال مجدد** (primary
  OAuth relogin), **کپی لینک اتصال** (copy manual link), and the **آموزش اتصال به اینستاگرام**
  help link (`HelpMeDialog`, same video). Removed the banner's per-account delete button
  (each visible card already has its own delete; a single `accounts[0]` delete was wrong
  with multiple invalids).

`layout.tsx` still renders `InstagramInvalidRedirector` (unchanged); its `InstagramInvalidDialog`
import there was already dead (never rendered) — left as-is. The banner remains scoped to
the settings page only.

## Changes

- Modified: `apps/dashboard/src/components/Settings/InstagramAccounts.tsx` (all-invalid guard),
  `apps/dashboard/src/components/Console/InstagramInvalidDialog.tsx` (centered multi-page banner).
- i18n (`instagramTokenError`, fa only per project rule — en later): `banner_title` (ICU plural),
  `banner_description` (ICU plural), `copy_link`, `copy_success`. Reused existing `relogin`,
  `how_to_connect`.
- No backend changes.

## Note / follow-up

Invalid = `!isIgTokenValid` only. A page with a valid token but an **unsubscribed webhook**
(`isIgWebhookSubscribed === false`) no longer triggers this settings-page banner — the
`GET /instagram/accounts` response has no webhook field, so the cards can't show it either.
The layout-level `InstagramInvalidRedirector` still redirects such users here (it reads
`user.instagrams`), so they could land on a page with no banner. If webhook-only breakage
needs surfacing, add `isIgWebhookSubscribed` to the accounts DTO and reflect it in both the
card and this predicate.

## Verification

- ICU plural rendered via bundled `intl-messageformat` for count=1 and count=3 — both correct.
- `tsc --noEmit` (dashboard) → no errors in the two changed files.
- `eslint` on both files → 0 errors (2 pre-existing unused-var warnings: `MAX_INSTAGRAM_ACCOUNTS`,
  `mutateLocal`).
- Visual: standalone RTL mockup of both states (some-invalid list+banner, all-invalid banner-only)
  confirmed centering, spacing, and copy.

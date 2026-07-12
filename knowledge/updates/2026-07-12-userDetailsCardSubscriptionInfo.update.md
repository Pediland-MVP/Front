# User Details Card Subscription Info Update (2026-07-12)

Simplifies the user details sidebar card by removing the workspace-wide credit/renewal row and showing the remaining subscription days (active and reserved combined) directly on each connected Instagram account with proper text truncation.

## Problem

In `UserDetailsCard.tsx`:
1. The top section displayed a workspace-wide subscription remaining days label ("اعتبار:") and a "تمدید" (renewal) button. This was redundant because subscriptions are bound to individual Instagram pages.
2. The Instagram list showed the static label "اینستاگرام:" next to each Instagram username without any subscription info.
3. Long Instagram usernames could overflow or wrap if they exceeded the width limit of the sidebar card instead of truncating cleanly with three dots (`...`).

## Solution

- `Front/apps/dashboard/src/components/Layout/UserDetailsCard.tsx`:
  - Updated imports to include `getRemainingDays` from `@/utils/subscription`.
  - Removed the top-level workspace subscription remaining days and renewal button `div` block completely.
  - In the Instagram list (`sortedInstagrams.map`):
    - Replaced the static `"اینستاگرام:"` label with a dynamic `{t('remainingDaysCount', { count: totalDays })}` label displaying combined active and reserved remaining subscription days for that Instagram account.
    - Updated the username `span` element class names from `line-clamp-1` to `truncate min-w-0` to ensure usernames are properly truncated with ellipsis when exceeding the style boundaries.
- `Front/apps/dashboard/src/messages/fa/Console.json` & `en/Console.json`:
  - Added the translation key `remainingDaysCount` (Farsi: `{count} روز`, English: `{count} days`) to the `Console.Dashboard` namespace.

## Verification

- The project was successfully compiled with `pnpm --filter front build`.
- The code passed static lint checks with `pnpm --filter front lint`.

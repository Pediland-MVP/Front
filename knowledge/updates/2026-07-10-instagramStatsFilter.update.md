# 2026-07-10 — Instagram filter on home stats

## Problem
The home-page stats always showed workspace-wide numbers; users with more than one
Instagram account could not narrow the view to a single account.

## Solution
`DashboardStats.tsx` now reads `useUser().user.instagrams` and, when there is more than
one account, shows a Select (default "All accounts"). Selecting an account appends
`?instagramId=<id>` to the `stats/overall` SWR key. Products keep the workspace total
with a "shared" hint.

## Changes
- `src/components/Console/Dashboard/DashboardStats.tsx`.
- i18n: `src/messages/fa/Console.json` (`allAccounts`, `productsSharedHint`),
  `src/messages/fa/ErrorCodes.json` (`INSTAGRAM_NOT_IN_WORKSPACE`).

## Verification
Manual: dropdown hidden with ≤1 account; with ≥2, selecting an account refetches and
updates the account cards while Products holds and shows the hint.

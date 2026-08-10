# BEF-163 Follow-Up: Automation List Single-Page Badge (2026-08-04)

Linear: [BEF-163](https://linear.app/befrooshapp/issue/BEF-163/aslahat-amwmy-ui). See also
`2026-08-03-bef163GeneralUiFixes.update.md` (the original 6-item bundle).

## Problem

BEF-163's ticket item asked for multi-page-only UI to stay hidden in **both** the
automation list and the automation-create form when a workspace has only one connected
Instagram page. The 2026-08-03 bundle only fixed the create form
(`InstagramSelectField.tsx`'s `<= 1` guard) — the automation **list** page
(`AutomationCard.tsx`) still unconditionally rendered its per-card "@username" badge,
which only makes sense to disambiguate between pages when there's more than one.

## Solution

`AutomationCard.tsx` now fetches the same `${API_URL}/instagram/accounts` SWR key already
used by `InstagramSelectField.tsx`/`AutomationForm.tsx` (identical key string, so SWR
dedupes — no extra network request) and only renders the Instagram username badge when
`accounts.length > 1`, mirroring the create form's `<= 1` hide guard.

## Changes

- `apps/dashboard/src/components/Automations/AutomationCard.tsx` — added the
  `useSWRImmutable` fetch and `hasMultipleInstagramAccounts` guard around the existing
  username badge block. No new i18n keys (reuses existing `no_instagram_assigned`).

## Verification

Reviewed against the established pattern from `InstagramSelectField.tsx` (same endpoint,
same fetcher, same guard semantics). No existing test file covers `AutomationCard.tsx`.
No manual browser verification yet.

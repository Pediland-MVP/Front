# 2026-07-11 — Hide Instagram filter for single-account workspaces

## Problem
The shared `InstagramFilter` is used on the Automations, Orders, Contacts, and Sessions
list pages. When a workspace had exactly one Instagram account, the filter still rendered
a non-interactive card showing that single account. The card added no value (there is
nothing to filter) and cluttered every list page.

## Solution
`InstagramFilter.tsx` now returns `null` whenever the workspace has 0 **or 1** Instagram
account. The auto-select `useEffect` runs before the render branches, so the single
account's id is still selected and each page keeps loading its data normally — only the
filter UI is hidden. The interactive multi-select popover is unchanged for 2+ accounts.

This fixes all four list pages at once, since they share the one component. The home-page
stats filter (`DashboardStats.tsx`) already hid itself at ≤1 account, so it needed no change.

## Changes
- `src/components/ui-custom/InstagramFilter.tsx`: merged the `accounts.length === 1`
  branch into the early `return null` (`accounts.length <= 1`) and deleted the
  single-account card markup. `AccountAvatar` is still used by the multi-select branch.

## Verification
Manual: with 1 account, no filter renders on Automations / Orders / Contacts / Sessions and
each page still loads its data (single account auto-selected). With ≥2 accounts, the
multi-select popover renders and filters as before.

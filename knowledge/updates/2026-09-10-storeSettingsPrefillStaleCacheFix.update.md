# 2026-09-10 — Fixed: final-message prefill silently skipped once its own hint already said it was applied

Supersedes the prefill behavior described in
`knowledge/updates/2026-09-09-commerceStoreSettings.update.md`. Front-only bug fix, no backend
change (the backend default-sync itself, `Back/knowledge/updates/2026-09-09-commerceDefaultFinalMessageSync.update.md`,
was correct).

## Problem

User report: create a physical product with a final message (this correctly became the workspace
default per the backend sync), then start creating a SECOND product — the hint under step ۱۱ says
"this is your store's default", but the textarea is empty.

Root cause: `ProductEditorPage`'s prefill effect had a one-shot `storeSettingsSeeded` ref. It
latched permanently the FIRST time `useStoreSettings`'s `isLoading` resolved to `false` — but SWR
can resolve `isLoading:false` with a STALE cached value (e.g. `null`, left over from an earlier
visit to `/products/settings` or the product list in the same SPA session) before its background
revalidation delivers the real default a moment later. The latch fired on that first, stale
resolution and never ran again — so the field stayed blank while the hint (computed straight from
the live `storeSettings`, not from this effect) correctly updated once the real value arrived.

## Solution

Removed the one-shot latch entirely. The effect now reruns on every `storeSettings` change and
re-applies the default AS LONG AS the field is still blank — that blank check alone is what stops
it from clobbering text the merchant already typed or a kind switch; a separate "already ran" flag
was never actually needed for that.

## Changes

- `apps/dashboard/src/components/Commerce/ProductEditor/ProductEditorPage.tsx` — dropped
  `storeSettingsSeeded` ref, simplified the prefill `useEffect`'s guard.

## Verification

- New regression test in `ProductEditorPage.test.tsx`: a stateful `useStoreSettings` mock that
  returns the stale value until an explicit trigger flips it to the real one, then forces a
  re-render — confirmed this FAILS against the pre-fix code and PASSES against the fix.
- Reproduced the exact real-world click path live in the browser (`/products/settings` → product
  list → "کالای جدید", all client-side navigation, no reload): field now correctly prefills.
- 16/16 `ProductEditorPage.test.tsx`, 68/68 across the three related test files, `tsc` clean.

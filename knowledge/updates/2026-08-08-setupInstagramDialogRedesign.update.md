# Restyle SetupInstagramDialog to match the Subscription buy-flow look (2026-08-08)

Related prior doc:
`knowledge/updates/2026-08-08-settingsInstagramSubscriptionGate.update.md`

## Problem

`SetupInstagramDialog` (the "buy a subscription for a 2nd Instagram" flow) used a plain
`DialogHeader` + bare bordered buttons, visually disconnected from the actual
`/settings/subscription` buy dialog (`ChoosePlan.tsx`) that the same purchase eventually
continues into. User asked for it to be restyled to match that page's look — not identical,
just visually consistent (same gradient header, card language, badges).

## Solution

Rebuilt `SetupInstagramDialog`'s presentation, reusing `ChoosePlan.tsx`'s buy-dialog visual
patterns: a violet-to-indigo gradient header with decorative blurred circles, `rounded-2xl`
duration cards with a "best value" badge on the longest duration, monthly-price + savings-vs-
baseline display, and a dedicated gradient "Buy" button per duration (via `ButtonLoading`),
plus the same treatment for the manual fallback plan grid. Reuses `Subscription` namespace
strings (`best_value`, `per_month_unit`, `cheaper_than_monthly`, `total_price`, `toman`, `buy`)
via a second `useTranslations('Subscription')` call alongside the existing
`SetupInstagramDialog` namespace, so no new translation keys were needed.

No logic changed — same lookup → matched-plan → duration-select → pay flow as before.

## Changes

- `apps/dashboard/src/components/Connect/SetupInstagramDialog.tsx` — full visual rewrite
  (see above); `DialogHeader`/`DialogFooter` dropped in favor of the gradient header block
  (still uses `DialogTitle`/`DialogDescription` for accessibility, just restyled).
- `apps/dashboard/src/components/Connect/SetupInstagramDialog.test.tsx` — the
  "disables every matched-plan duration button" test previously located each duration by
  `getByText(duration.name).closest('button')`, because the whole row used to be one button.
  The row is now a card with a separate "Buy" button (matching `ChoosePlan`'s split of
  info-card vs. buy-button), so the test now asserts the duration name renders and locates
  the buy buttons by their shared `Subscription.buy` label instead.

## Verification

- `node_modules/.bin/vitest run "src/components/Connect/SetupInstagramDialog.test.tsx"` — 4/4 pass.
- `node_modules/.bin/vitest run "src/app/(Connect)/connect/page.test.tsx"` — 5/5 pass (this
  page renders `SetupInstagramDialog` too; unaffected since it only toggles `open`).
- Not manually verified in-browser (see conversation: dev server was not started for this
  change to avoid stacking Node processes).

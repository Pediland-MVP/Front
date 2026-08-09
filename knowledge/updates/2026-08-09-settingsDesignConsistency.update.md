# 2026-08-09 — Settings Design Consistency

Full spec: `docs/superpowers/specs/2026-08-09-settings-design-consistency-design.md`

## Problem

`/settings/workspace` and `/settings/subscription` visually contradicted
the rest of the app: full-width inputs on desktop, a bare unstyled
empty-state paragraph sitting next to a button with no spacing, and buttons
with ad-hoc `rounded-xl`/custom shadow/padding overrides on top of the
shared `Button` component instead of using its `variant`/`size` props.

## Solution

Removed the ad-hoc overrides and made both pages use the shared `Button`/
`Input` components as-is, and capped form width to `w-full md:w-1/2` —
matching the existing correct convention already used on
`/settings/card`.

## Changes

- `apps/dashboard/src/components/Settings/WorkspaceForm.tsx` — form width
  capped to `w-full md:w-1/2`.
- `apps/dashboard/src/app/(Console)/settings/workspace/page.tsx` — raw
  `<input>` in the create-workspace dialog replaced with the shared
  `Input`; ad-hoc `rounded-xl`/padding overrides removed from the "فضای کار
  جدید" trigger button and the dialog's Cancel/Create buttons.
- `apps/dashboard/src/components/Settings/ChoosePlan.tsx` — empty-state
  message wrapped in a bordered/padded box (matching the Instagram-accounts
  empty-state pattern); ad-hoc gradient/shadow/radius overrides removed
  from the "خرید اشتراک" button and the per-plan buy button (recommended
  vs. non-recommended distinction kept via the existing `variant` prop).

## Backend

None — Front-only styling fix.

## Verification

- `cd apps/dashboard && npx vitest run src/app/\(Console\)/settings/workspace/page.test.tsx`
  — all existing tests still pass.
- Manual: `/settings/workspace`, `/settings/card`, `/settings/subscription`
  visually compared side by side; input widths and button shapes/radii now
  match across all three and match `/settings/instagram`.

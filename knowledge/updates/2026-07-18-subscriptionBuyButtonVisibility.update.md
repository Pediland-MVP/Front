# 2026-07-18 — Fix invisible "خرید اشتراک" button on subscription settings page

Reference code: `apps/dashboard/src/components/Settings/ChoosePlan.tsx`.

## Problem

The main "خرید اشتراک" button (opens the buy-subscription dialog) on
`/settings/subscription` rendered with a white/no background, making it
invisible against the page.

## Solution

The button's `className` set `bg-violet-650`, which is not a real Tailwind
class — the default color palette only defines shades in steps of 100
(`violet-600`, `violet-700`, ...), not `650`. Since Tailwind's JIT compiler
never generates CSS for a class it doesn't recognize, `bg-violet-650`
produced no rule at all. Because `cn()` uses `tailwind-merge`, which still
pattern-matches `bg-violet-650` as a background-color utility and strips the
`Button` component's own `bg-primary/90` default for that reason, the button
ended up with **no** background color applied — falling back to the browser
default (white).

Fix: changed `bg-violet-650` → `bg-violet-600`, matching the violet
gradient already used elsewhere in this same dialog (e.g.
`from-violet-600 to-indigo-700`).

Note: this file has several other odd non-standard Tailwind shades
(`violet-750`, `violet-555`, `slate-350`, `slate-450`, `amber-550`, etc.)
that are likely similarly broken, but only the reported button was in
scope for this fix.

## Verification

Code-reasoned fix (1-line change); not visually verified in-browser per
user request — user will verify manually.

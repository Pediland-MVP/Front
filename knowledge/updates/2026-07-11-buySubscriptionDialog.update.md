# Buy-Subscription Flow Moved Into a Dialog (2026-07-11)

The plan-purchase process on `settings/subscription` (`ChoosePlan.tsx`) now runs inside a
modal dialog instead of expanding inline on the page.

## Problem

Clicking "خرید اشتراک" set `showBuyFlow = true` and rendered the whole purchase process —
page picker → plan-duration selection → discount code — **inline**, pushing the rest of the
page down. It read as a long scroll rather than a focused task.

## Solution

`components/Settings/ChoosePlan.tsx` — wrapped the buy flow in the shared `Dialog`
(`@/components/ui`), controlled by the existing `showBuyFlow` state:

- The "خرید اشتراک" button is now the `DialogTrigger`. `open={showBuyFlow}` /
  `onOpenChange` keeps the same state, so a per-page CTA (`instagramId` prop →
  `showBuyFlow` starts `true`) still auto-opens the dialog straight to plan selection.
- On close, `selectedInstagramId` resets to the initial `instagramId` and
  `selectedDurationId` to `null`, so reopening starts fresh.
- `DialogContent` (`max-h-[85vh] overflow-y-auto sm:max-w-2xl`) holds: the page picker
  (`{!selectedInstagramId && …}`), the plan-duration cards (`{selectedInstagramId && …}`),
  and `<DiscountCode />` — moved inside so the discount is entered alongside the plans.
- Header uses `DialogTitle` = `buy_subscription` + `DialogDescription` = `plan_title`.
- The dropped `{!showBuyFlow && …}` / `{showBuyFlow && …}` guards are gone; visibility is now
  the dialog's job. All purchase logic (`selectPlanHandler`, `onSubmit`, `usePlansForPage`,
  `pay`) is unchanged.

The "اشتراک‌های رزرو شده" link stays on the page (in the same flex row as the trigger).

## Plan-card redesign (same change)

The plan-duration cards inside the dialog were rebuilt around the real value story:

- **Best-value tier** — durations are sorted by length (longest first) and the longest is
  flagged recommended (`recommendedDurationId`): violet ring + `best_value` ("بهترین ارزش")
  corner badge + a filled primary buy button. The others are quiet (gray border, `outline`
  buy button) so the emphasis sits in one place.
- **Price hierarchy** — a duration pill, then the **monthly price** as the hero
  (`text-3xl font-extrabold`, `{price} تومان / ماه`), then the total (`total_price`), with the
  original price struck through when a discount applies.
- **Savings signal** — each non-monthly plan shows a green pill
  `{percent}٪ ارزان‌تر از پلن ماهانه`, computed against the 30-day price
  (`monthlyBaselinePrice`). This is the card's signature — it answers "which plan saves me
  most" at a glance.
- **VPN notice** softened from a `destructive` red `Alert` to a compact amber note.
- Removed the redundant `package_title` h3 (it duplicated the dialog description); the dialog
  now uses a distinct `buy_dialog_subtitle`. Replaced the `Card`/`CardContent`/`CardFooter`
  plan card with a plain styled `div` + `ButtonLoading` (dropped the now-unused `CardFooter`
  import).

## Changes

- `components/Settings/ChoosePlan.tsx` — buy flow wrapped in `Dialog`; `DiscountCode` moved
  inside; plan cards redesigned (best-value flag, monthly-price hero, savings pill, amber VPN
  note). Added Dialog primitives + `TrendDownIcon`/`WarningCircleIcon`; removed `CardFooter` /
  `ClockCountdownIcon`. Formatted with prettier.
- i18n (`Subscription`, fa only per project rule): `buy_dialog_subtitle`, `best_value`,
  `per_month_unit`, `cheaper_than_monthly` (`{percent}`), `total_price`.

## Follow-up fixes (same day)

- **Desktop x-overflow** — the Radix dialog is a `grid` and the plan cards are `flex-1` flex
  children (default `min-width: auto`), so three cards could push past `max-w-2xl` and scroll
  horizontally. Fixed with `min-w-0` on the content wrapper and on each plan card.
- **Discount code moved** from the bottom of the dialog to directly **under the VPN notice**
  (above the plan cards), inside the plan-selection view (so it only shows once a page/plans
  are chosen, and prices reflect the code before you pick).
- **Selected page shown** — the plan step now leads with the target page (avatar +
  `@username` under a `buying_for` = "خرید اشتراک برای" label) beside the back button, from
  `selectedInstagram` (`instagramById.get(selectedInstagramId)`).
- **Local payment callback** — `Back/apps/core/.env` `ZIBAL_SUBSCRIPTION_CALLBACK_URL`
  pointed at prod (`https://my.befroosh.app/...`) while `PAYMENT_DEFAULT_GATEWAY='zibal'`, so
  a local test payment redirected to production. Repointed to
  `http://localhost:3000/settings/subscription/verify` (matching `FRONT_URL` and the already-
  local `ZARINPAL_SUBSCRIPTION_CALLBACK_URL`). Gitignored env only; restart core to apply.

## Verification

- `tsc --noEmit` (dashboard): no new errors (the single ChoosePlan error is the pre-existing
  repo-wide zod-version-mismatch on `zodResolver`).
- `eslint`: 0 errors (one pre-existing `setDiscountCode` unused-var warning).
- Visual mockup of the redesigned dialog (best-value card highlighted, savings pills, amber
  VPN note, discount inside the modal) confirmed the layout.

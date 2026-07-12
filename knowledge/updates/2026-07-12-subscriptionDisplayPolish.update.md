# Subscription Validity and Reserved Display Polish (2026-07-12)

Simplifies the page subscription validity display by merging active and reserved days, removing the redundant reserved list, and integrating the subscription buy button directly inside the validity row.

## Problem

Under `/settings/instagram` (Instagram settings accounts list), each page card displays a subscription status card containing:
1. An active subscription label ("پوشش با پلن X") and remaining days count ("Y روز مانده").
2. A separate list of reserved subscriptions (e.g. "رزروها: 730 روز" or "رزرو: پلن X (Y روز)").
3. A row with a helper hint ("پس از پایان اشتراک فعلی، به‌صورت خودکار فعال می‌شود") next to a small "خرید اشتراک" button.

This presentation was overly busy and separated the current and future plan periods instead of showing a unified remaining credit duration.

## Solution

- `Front/apps/dashboard/src/components/Settings/PageCoverageBadge.tsx`:
  - Updated the active subscription path (`if (pageSubscription)`) to compute `totalDays = remainingDays + totalReservedDays`.
  - Swapped `{days} روز مانده` to the left-hand primary label position (`flex-1`).
  - Embedded the `"خرید اشتراک"` (`buy_additional_cta`) button directly into the right-hand side of the same row (replacing `"اعتبار باقی مانده"` / `"پوشش با پلن"`).
  - Adjusted internal padding of the row (`p-1.5 pe-2.5 ps-1.5`) to accommodate the embedded button.
  - Used `totalDays` for the expiration threshold check (`isExpiringSoon = totalDays < 7`) and passed it to the `page_days_left` translation helper.
  - Completely removed the `reservedSection` markup so separate "رزرو" badges are not displayed.
  - Removed the `buy_additional_hint` text.
  - Removed the unused `ClockCountdownIcon` import to maintain clean imports.
- `Front/apps/dashboard/src/messages/fa.json` & `en.json`:
  - Updated `page_covered_by_plan` to "اعتبار باقی مانده" (Persian) and "Remaining credit" (English).

## Verification

- The project compiled successfully via `pnpm --filter front build`.

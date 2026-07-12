# Buy-Subscription Dialog Visual Overhaul (2026-07-11)

Redesigned the plan-purchase process on `settings/subscription` to provide a premium, modern, and engaging user experience.

## Problem

The previous buy-subscription dialog was simple, plain, and lacked visual hierarchy. Specifically:
- The page selector was a generic grid of cards with no status feedback (e.g., active subscription or invalid tokens).
- The pricing plan cards were stacked vertically with basic borders and did not communicate value or savings clearly.
- There was no display of features included in the plan, leaving the user with a lack of detail about what they are buying.
- The discount code form did not allow removing/clearing code once applied, requiring a page refresh to cancel.
- The Instagram username was displayed multiple times in both the header description and the sub-header.
- The discount/coupon input was located at the bottom of the scroll on mobile, separating it from the pricing cards.
- Profile pictures did not have fallback handling if their URL failed to load.

## Solution

We performed a comprehensive visual and UX overhaul of `ChoosePlan.tsx` and `DiscountCode.tsx`:

- **Interactive Page Selection (Step 1)**:
  - Each connected Instagram account is displayed as a sleek card with an Instagram-colored gradient ring on the avatar.
  - Active subscription status is shown using a subtle green pill badge (e.g., "اشتراک فعال (یک‌ماهه)").
  - Token issues are clearly flagged with a rose badge ("نیاز به اتصال مجدد") to notify the user before proceeding.
  - Added smooth hover transitions (slight translation, drop shadow, and dynamic arrow indicator).

- **Structured Purchase Layout (Step 2)**:
  - Divided the dialog into a responsive two-column layout on desktop:
    - **Right Column (5 cols in RTL)**: Displays the plan features list with checkmarks (`CheckCircle2`), description text, and the desktop-only discount code box.
    - **Left Column (7 cols in RTL)**: Displays duration cards and warning banners (VPN notice, renewal queue warning).
  - Cleaned up duplicate username displays:
    - The dialog header description displays `t('buy_dialog_subtitle')` dynamically.
    - The sub-header displays ONLY the back button, removing the redundant `خرید اشتراک برای: @username` text block.

- **Mobile-Responsive Promo Section**:
  - Leveraged Tailwind responsive display utilities (`hidden md:block` and `block md:hidden`) to position the coupon section directly under the VPN warning banner on mobile screens. This ensures users do not have to scroll to the bottom of the dialog to enter promotional codes.

- **Profile Picture Fallbacks**:
  - Implemented a self-contained `<InstagramAvatar />` component inside `ChoosePlan.tsx` which tracks image load errors (`onError` handler) and automatically falls back to a default Instagram placeholder icon.

- **Redesigned Duration Cards**:
  - The recommended plan card is highlighted using a violet border, a subtle gradient glow, and a premium gradient buy button (`bg-gradient-to-r from-violet-600 to-indigo-650`).
  - Added clear discount percentages (e.g., "۲۰٪ تخفیف") as a red badge next to the plan duration name.
  - Prices are split into a large equivalent monthly price (the hero value) and a smaller total price at the bottom, matching premium SaaS purchase flows.
  - Added a hover elevation effect on the cards.

- **Clear-Coupon UX Action**:
  - Redesigned `DiscountCode.tsx` with a ticket icon inside the input and a modern inline layout.
  - If a code is active, it renders a success pill banner with a bounce-animated gift icon and a clear "حذف کد" (Delete Code) button to reset the coupon.

## Changes

- `Front/apps/dashboard/src/components/Settings/ChoosePlan.tsx`: Overhauled layout into two columns, redesigned cards, integrated follower-based features checklist, styled warnings and icons, added responsive promo box placement, and added profile picture error fallback component.
- `Front/apps/dashboard/src/components/Settings/DiscountCode.tsx`: Overhauled to support inline coupon inputs and code clearing with an active coupon banner.

## Verification

- Compiled successfully with `pnpm build --filter=front`.

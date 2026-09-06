# Tracking value: carrier URL → post-office code, plain text not a link — 2026-09-06

Full reference: `Back/knowledge/core/commerce/orders.doc.md`'s "Buyer notification" section,
`knowledge/updates/2026-09-05-orderFollowUpAndShipping.update.md` (the original build this
reshapes).

## Problem

Back renamed `commerce_order.trackingUrl` (a carrier URL, delivered to the buyer on a `web_url`
button) to `followUpCode` — the post office's/courier's own tracking CODE, delivered as its own
plain-text DM instead. Front's `OrderView` type, dialogs, and the summary rail all still spoke
`trackingUrl` and validated it as a URL (`isValidTrackingUrl`, `new URL()` + protocol check).

## Solution

- `types/commerceOrders.ts` — `OrderView.trackingUrl` → `followUpCode`.
- `hooks/useCommerceOrder.ts` — `ship(followUpCode?)`, `updateTracking(followUpCode, notify)`.
- `dialogs/trackingUrl.util.ts` **deleted**, replaced by `dialogs/followUpCode.util.ts`:
  - `isValidFollowUpCode` mirrors Back's `@Matches(/^[A-Za-z0-9-]+$/)` + `@MaxLength(50)` exactly —
    English letters/digits/hyphens only, no carrier-specific format.
  - `normalizeFollowUpCodeInput` converts Persian/Arabic digits to English WITHOUT stripping
    letters — the dashboard's existing `p2eNumber.ts` default export strips every non-digit
    character (correct for a pure-number field like a price), which would delete the English
    letters a follow-up code can contain (e.g. `RA123456785IR`). This is CLAUDE.md §18's rule
    applied to a field that is alphanumeric, not purely numeric.
- `ShipOrderDialog.tsx`/`EditTrackingDialog.tsx` — field renamed, `onChange` runs
  `normalizeFollowUpCodeInput` first, validation swapped to `isValidFollowUpCode`,
  `maxLength={50}` (was 500), `data-testid` changed from `tracking-url` to `tracking-code`.
- `OrderStatusUpdater.tsx`/`OrderDetailPage.tsx`/`OrderDetail.tsx` — parameter renames only, no
  behavior change (still "carried only by `ship`", same as before).
- `OrderSummaryRail.tsx` — the tracking value no longer renders as an `<a href>` link (`target=
  "_blank"`, `rel="noopener noreferrer"`, underlined). It is now a plain `<span dir="ltr">` — a
  CODE is pasted into the carrier's own tracker, never tapped, so there is nothing to link to.
  New `data-testid="tracking-value"` for the read-only display (kept separate from
  `tracking-code`, which now names the EDITABLE input in both dialogs — the two coexist in the DOM
  once the edit dialog is open, so they needed different testids).
- `messages/fa.json` — لینک پیگیری → کد رهگیری throughout; `ship.urlHint`→`ship.codeHint`,
  `ship.invalidUrl`→`ship.invalidCode`, `tracking.invalidUrl`→`tracking.invalidCode` (key renames,
  not just value edits, since "invalid URL" is a materially different claim than "invalid code").

## Changes

- `apps/dashboard/src/types/commerceOrders.ts`
- `apps/dashboard/src/hooks/useCommerceOrder.ts`
- `apps/dashboard/src/components/Commerce/Orders/dialogs/followUpCode.util.ts` (new)
- `apps/dashboard/src/components/Commerce/Orders/dialogs/trackingUrl.util.ts` (deleted)
- `apps/dashboard/src/components/Commerce/Orders/dialogs/{ShipOrderDialog,EditTrackingDialog}.tsx`
- `apps/dashboard/src/components/Commerce/Orders/{OrderStatusUpdater,OrderDetailPage,OrderDetail,OrderSummaryRail}.tsx`
- `apps/dashboard/src/messages/fa.json`
- All corresponding test files updated in lockstep, including new coverage for Persian-digit
  normalization and the 50-char/character-set validation boundary.

## Verification

- `npx vitest run src/components/Commerce/Orders src/hooks/useCommerceOrder.test.tsx` — 18 test
  files, 178 tests, all pass.
- `pnpm --filter front exec tsc --noEmit` — zero new errors; the pre-existing, unrelated baseline
  (zod-version type mismatches, `next/image` module resolution in `packages/ui`, legacy
  `app/(Console)/orders`/`components/Orders` `BadgeProps`/`ImageWithFallback` errors) is untouched
  and does not overlap any file this change touched.
- No `trackingUrl` string remains anywhere in `apps/dashboard/src` except two intentional
  historical docstring mentions (`types/commerceOrders.ts`, `followUpCode.util.ts`) explaining
  what the field used to be called and why.

## Not yet done

- `en.json` still carries the old `urlHint`/`invalidUrl` keys under the (now dead) old key names —
  per CLAUDE.md §8, only `fa.json` needs updating now; `en.json` is translated later and picks up
  the renamed keys then.

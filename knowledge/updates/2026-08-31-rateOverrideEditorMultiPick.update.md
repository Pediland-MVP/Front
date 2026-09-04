# RateOverrideEditor: multi-pick with one shared price — 2026-08-31

Reference: `components/Commerce/Shipping/RateOverrideEditor.tsx`,
`Back/knowledge/updates/2026-08-31-citiesEndpointRequiredProvinceId.update.md` (paired backend
fix), `knowledge/updates/2026-08-27-commerceShippingMethods.update.md` (original feature).

## Problem

Two user reports on the shipping-exception search box, in sequence:

1. City search only ever suggested provinces. Root cause was on the Back: `GET /cities`'s
   `provinceId` query param was `@IsNumber()` with no `@IsOptional()`, so a no-filter fetch (the
   `useShippingDestinations` hook's "get every city once" call) 400'd — `cities` stayed
   permanently `[]` client-side while `/cities/provinces` succeeded. Fixed on the Back
   (`readAllCities.dto.ts`).
2. Once cities started coming back, a second bug surfaced: picking a city showed it as "انتخاب
   شد: تهران" next to the search box (the box itself filled with the picked name), but the box's
   own `onChange` cleared that pick on the very next keystroke — so trying to search for a SECOND
   destination silently discarded the first. The editor only ever supported adding one exception
   per round trip through the form.

## Solution

Replaced the single `pending: ShippingDestination | null` slot with `pendingList:
ShippingDestination[]`. Picking a suggestion now appends to the list and clears the search box
(ready for the next search) instead of replacing the box's contents — so typing to search for a
second destination never touches the first pick. Each pick renders as its own removable chip under
"انتخاب شد:". The one price field applies to the whole batch: "افزودن" commits every picked
destination as its own `ShippingOverrideDraft` row, all sharing that one amount. `taken` (the
dedupe set search results are filtered against) now also excludes whatever is already in
`pendingList`, and the 200-per-option cap is checked against the whole pending batch, not one row
at a time.

## Changes

- `RateOverrideEditor.tsx`: `pendingList` state, `pickDestination`/`unpickDestination`/`addRows`/
  `resetDraft` replacing the old `pending`/`clearDraftRow`/`addRow`. No prop or draft-type changes
  — `ShippingOverrideDraft` still models one row at a time; the batch only exists transiently in
  this component's own state.
- No new translation keys — reused `exceptionsSelected`/`exceptionsClearSelected`/
  `exceptionsAddButton`/`exceptionsLimit`.

## Verification

`RateOverrideEditor.test.tsx`: 16/16 pass (11 pre-existing behaviors unchanged, 5 new — chip
rendering, pick survives further typing/clearing, multi-pick commits together with one shared
price, removing one chip only drops that one, an already-picked destination is excluded from
further search results). `ShippingMethodCard.test.tsx`/`ShippingSettings.test.tsx`: 33/33 pass,
unaffected. `tsc --noEmit`: no new errors (one pre-existing, unrelated error in the legacy
`(Shop)/[shopId]/[productId]/order/components/shippingInfo.tsx`). `eslint`: clean.

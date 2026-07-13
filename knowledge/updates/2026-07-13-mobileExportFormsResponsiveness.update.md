# Mobile Export Forms Responsiveness Fix (2026-07-13)

Fixes two mobile-only bugs: date-picker inputs triggering iOS Safari's auto-zoom-on-focus, and drawer/dialog forms whose top and bottom content was unreachable because nothing in the layout could scroll.

## Problem

1. **Date-zoom bug** (Sessions excel export, Orders excel export, Contacts excel export): the `react-multi-date-picker` inputs in all three excel-export forms were styled with an inline `fontSize: '14px'`. iOS Safari auto-zooms the viewport on focus for any input with a computed font-size below 16px, and the user had no easy way to zoom back out or pan to the rest of the form.
2. **Scroll-cutoff bug** (all `Drawer`-based forms, and the Contacts "edit contact" dialog): the shared `DrawerContent` (`packages/ui/src/components/ui/drawer.tsx`) had `h-auto` with no `max-h-*` or `overflow-y-*`, so on short mobile viewports tall content simply overflowed above the top of the screen with no way to reach it. The shared `DialogStyledBody` (`packages/ui/src/components/ui-custom/dialogStyled.tsx`) already had `overflow-y-auto`, but was missing `min-h-0` — a flex child defaults to `min-height: auto` (its content size), so it never actually shrank to the parent's `max-h-[90dvh]` cap, and the parent's `overflow-hidden` just clipped the excess instead of scrolling.

## Solution

- `packages/ui/src/components/ui/drawer.tsx`:
  - `DrawerContent`: added `max-h-[calc(100dvh-6rem)]` (respects the existing `mt-24` top gap) and wrapped `{children}` in a `flex min-h-0 flex-1 flex-col overflow-y-auto` div so the whole drawer body scrolls instead of overflowing off-screen.
  - `DrawerHeader` / `DrawerFooter` / the grabber handle: added `shrink-0` so they keep their size while the middle content scrolls — this matches the already-proven working pattern used ad hoc in `editOrderDialog.tsx`.
  - This is a shared-component fix, so it applies to every `Drawer` consumer app-wide (excel-export drawers, `WorkspaceDrawer`, `product.dialog`, `ChooseAutomationType`, `questionAnswer.dialog`, `orderConfirmation.drawer`), not just the three forms reported.
- `packages/ui/src/components/ui-custom/dialogStyled.tsx`:
  - `DialogStyledBody`: added `min-h-0` alongside the existing `flex-1 overflow-y-auto` so it actually respects the parent's `max-h-[90dvh]` cap and scrolls. Fixes the Contacts "edit contact" dialog (`ContactDetailsDialog.tsx`), currently the only consumer of `DialogStyled*`.
- `apps/dashboard/src/components/Sessions/excelExportSessions.tsx`, `apps/dashboard/src/app/(Console)/orders/components/excelExportOrders.drawer.tsx`, `apps/dashboard/src/app/(Console)/contacts/components/excelExportContacts.drawer.tsx`:
  - Changed the `datePickerStyles.fontSize` from `'14px'` to `'16px'` on the `startDate`/`endDate` `DatePicker` inputs, matching the existing anti-zoom convention already used by the shared `Input` component (`text-base` = 16px, only dropping to 14px at the `md:` breakpoint where iOS zoom doesn't apply).

## Verification

- `pnpm --filter front lint`: 0 errors (pre-existing warnings only, unrelated to this change).
- Verified live in the running dashboard app at a 390px mobile viewport (same-origin iframe trick, since window resize emulation wasn't available in this environment):
  - Sessions, Orders, and Contacts excel-export drawers: confirmed `input.rmdp-input` computed `font-size` is `16px` (previously `14px`).
  - Contacts excel-export drawer: confirmed a visible scrollbar and that the previously-hidden footer (`ارسال درخواست` / `انصراف`) becomes reachable by scrolling.
  - Contacts edit-contact dialog: confirmed a visible scrollbar, the header stays pinned while the body scrolls, and the previously-hidden `ذخیره تغییرات` / `انصراف` buttons at the bottom become reachable.

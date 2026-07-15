# Consistent Empty States for Contacts/Orders/Automations, and a Height Bug Fix (2026-07-12)

Aligns the Contacts list's empty state with Products/Orders/Automations, and fixes a
layout bug where the empty message in Orders/Automations/Contacts sat cramped near the top
of the card instead of centering in the available height (Products already did this right).

## Problem 1: Contacts had no page-specific empty message

Products, Orders, and Automations each render their own centered "no products / no orders /
no automations" text when a list is empty. Contacts was the odd one out: it renders through
the shared `DataTable` component (`components/Table/TableData.tsx`), which only had a single
generic fallback row (`DataTable.noResults`, "رکوردی برای نمایش وجود ندارد.") — not a
contacts-specific message, and there was no `no_contacts` key at all.

## Problem 2: the empty message didn't fill the available height

Products' list component returns a bare Fragment (`<>...</>`) as its root, so its
`<div className="flex-1">` empty-state wrapper is a direct flex child of the height-bearing
`LayoutCard` (`flex h-full flex-col`) and correctly grows to fill the card. Orders and
Automations instead wrap everything in an extra `<div className="flex flex-col gap-4">` with
no height of its own — so the inner `flex-1` div had nothing to grow into and just sized to
its text content, leaving a large empty gap below before the pagination row. Contacts had the
analogous issue inside `DataTable`'s empty `<TableRow>` (a fixed `h-14` row).

## Solution

- `components/Table/TableData.tsx`:
  - Added an optional `emptyMessage?: string` prop to `DataTable`. When passed, it replaces
    the generic `t('noResults')` text in the empty-row fallback; when omitted, existing
    consumers keep today's generic text unchanged.
  - `<Table>` now gets `className="h-full"` so the `<table>` element itself can stretch to
    fill its scroll container.
  - The empty-row `<TableCell>` now stretches (`h-full`) and centers its message with an
    inner `flex h-full min-h-40 items-center justify-center` wrapper, matching the
    Products/Orders/Automations centering pattern instead of a fixed 56px row.
- `components/Contacts/ContactsList.tsx`: root wrapper changed to
  `flex h-full min-h-0 flex-1 flex-col gap-4` (was `flex flex-col gap-4`) so it actually
  grows inside `LayoutTable`; passes `emptyMessage={t('no_contacts')}` (namespace
  `Contacts.List`) to `<DataTable>`.
- `components/Orders/OrdersCardList.tsx` and `components/Automations/AutomationsCardList.tsx`:
  same root wrapper fix (`flex h-full min-h-0 flex-1 flex-col gap-4`) so their existing
  `flex-1` empty-state div actually gets real height inside `LayoutCard`.
- Added `Contacts.List.no_contacts` to `fa.json` ("هیچ مخاطبی وجود ندارد.") and `en.json`
  ("No contacts found."), matching the `no_products`/`no_orders`/`no_automations` convention.
- The Instagram filter and search box stay above the list/table and are unaffected — only the
  empty-state area's height and (for Contacts) text changed.
- `DataTable` has one other consumer, `AutomationsListTable.tsx`, but it isn't imported by any
  page (dead code), so the `TableData.tsx` change is a safe, isolated change.

## Verification

- `tsc --noEmit` and `eslint` clean on all touched files (only pre-existing, unrelated
  warnings).
- Visually confirmed in a running browser (Chrome via the Claude-in-Chrome extension) on
  `/orders`, `/automations`, and `/contacts` with 0 items: the empty message now centers in
  the full available card/table height instead of sitting near the top with a large blank
  gap below.

# 2026-08-04 — `/contacts` Mobile Table Scroll & Header Spacing

Reference: `packages/ui/src/components/ui/sidebar.tsx`,
`apps/dashboard/src/app/(Console)/contacts/page.tsx`,
`apps/dashboard/src/components/Contacts/ContactsList.tsx`

> **Note:** `apps/dashboard/src/components/ui` and `apps/admin/src/components/ui` are both
> **symlinks** to `packages/ui/src/components/ui`. They are not per-app copies — editing
> `sidebar.tsx` changes both apps at once.

## Problem

Two mobile-only bugs on `/contacts`:

1. **The contacts table could not be scrolled horizontally.** The table needs ~650px but
   the screen is 390px, so two columns (آیدی اینستاگرام, پیام ها) were unreachable.
2. **The Excel-export button and the Instagram filter were badly spaced** — the export
   button sat on its own full-width row under the title bar as a near-invisible `outline`
   button on the purple gradient, and the filter pill was jammed flush against the panel's
   rounded top edge and both side edges.

## Root cause

Measured in-browser at 390×844:

| Element | Height | Width |
|---|---|---|
| table scroll box (`overflow-auto`) | **1368px** | client 390 / scroll **650** |
| `_layout-table` (`h-full overflow-y-auto`) | 1496px | never scrolled |
| `SidebarInset` (`overflow-hidden`) | 1644px | — |

The table's scroll box *was* horizontally scrollable (650 > 390) — but the box itself was
1368px tall, so its horizontal scrollbar sat at y≈1520, roughly 680px below the viewport.
Nothing ever brought it on screen.

`SidebarInset` (`packages/ui`) bounded its height only at `md` (`md:max-h-screen`). Below `md` nothing in
the chain had a definite height, so `LayoutTable`'s `h-full` (`height: 100%`) resolved to
`auto`, the whole column grew to content height, and `flex-1` on the table box meant
nothing. Desktop worked because `md:max-h-screen` gave the same chain a definite height.

For the spacing bug: the export button was built into `HeaderTools`, but `_tools` is
`w-full` on mobile (`ConsoleHeader.tsx:67`), so it wrapped onto its own row. Every other
page (e.g. `orders/page.tsx`) puts export in `HeaderButton` next to the search toggle.

## Solution

- **`SidebarInset`** (`packages/ui`) — apply the height cap at every breakpoint (`max-h-svh`), not just at
  `md`. To make that safe app-wide, mobile now scrolls on `SidebarInset` itself
  (`overflow-x-hidden overflow-y-auto`) instead of on `body`; desktop keeps
  `md:overflow-hidden`. Pages without their own scroll container (e.g. `invitations`,
  `settings/*`) therefore still reach all their content rather than being clipped by the
  new cap. `svh` (not `dvh`) so a collapsing mobile URL bar cannot hide content.
- **`contacts/page.tsx`** — moved the export button from `HeaderTools` into `HeaderButton`,
  as a labelled `size="md"` solid button with `DownloadIcon`, matching `orders/page.tsx`.
  `HeaderTools` is now just the `SearchInput`, so it collapses to nothing when the search
  is closed and no stray row is left behind.
- **`ContactsList.tsx`** — gave the Instagram filter its own padded row
  (`px-3 py-3 md:px-4`) instead of relying on the column's `gap-4`. `empty:hidden` on that
  row means it disappears entirely when `InstagramFilter` returns `null` (workspaces with
  ≤1 Instagram account), so no phantom padded gap is left. The table stays **full-bleed**
  on purpose — its violet sticky header band reads better edge-to-edge, and every pixel of
  width helps on a 390px screen.

## Changes

- `packages/ui/src/components/ui/sidebar.tsx` — **affects `apps/dashboard` *and*
  `apps/admin`**, both of which symlink `src/components/ui` at this path.
- `apps/dashboard/src/app/(Console)/contacts/page.tsx`
- `apps/dashboard/src/components/Contacts/ContactsList.tsx`

`apps/admin` was checked statically: its `(main)/layout.tsx` wraps every page in
`LayoutPage`, whose root is `flex flex-1 flex-col overflow-auto` — its own scroll
container. So a bounded `SidebarInset` makes admin's `flex-1` resolve on mobile the same
way it already does at `md`, rather than clipping anything.

## Verification

- Root cause measured in a real browser at 390×844 (DOM geometry above), not inferred.
- **No visual pass was run on the fix itself** — the changes were merged before a dev
  server was started against this branch. No unit tests cover this either; it is layout
  CSS.
- Still worth a visual check on mobile: `/contacts` (the fix), plus the `(Console)` pages
  that have no scroll container of their own, since the `SidebarInset` change is app-wide —
  `invitations`, `settings` and its sub-pages, `help/learn`, `help/support`,
  `automations/sessions`, `comments/[id]`, `directs/[chatId]` — and a spot-check of
  `apps/admin` on mobile.

# Settings Mobile Scroll Fixes — 2026-08-14

Reference docs: this file is the full reference. Related: `2026-07-13-mobileExportFormsResponsiveness.update.md`
(earlier Drawer/Dialog scroll work), `2026-08-09-settingsRestructure.update.md` (the settings layout this touches).

## Problem

On mobile, `/settings/*` had three separate scroll defects. All were measured in Chrome device
mode at a 844px-tall viewport, where `NavBottom` (`h-14`, fixed) occupies y=788..844.

### 1. A 56px strip of every page sat under the bottom nav

`SidebarInset` carried `pb-14` to reserve room for the fixed `NavBottom`, but it is also the mobile
scroll container (`overflow-y-auto`). Padding cannot reserve space there:

- it sits **inside** the scroll box, so it never shrinks a height-filling child, and
- when the overflow comes from an `overflow:visible` descendant, Blink leaves that end padding out
  of `scrollHeight` as well.

`settings/layout.tsx` then compounded it with `h-full` — 100% of the scroll container's box while
the 56px header was already inside that same box. Once content grew past the screen the column
overshot by exactly the header height.

Measured on `/settings/instagram`, `/settings/card`, `/settings/zarinpal` (no inner scroller):
at **maximum** scroll the content bottom was 844 against a nav top of 788 — 56px that no gesture
could ever reveal.

### 2. Nested scroll containers on the `LayoutSettings` pages

`/settings/workspace`, `/settings/subscription`, `/settings/profile`, `/settings/team` render
through `LayoutSettings`, which added its own `overflow-y-auto`. That produced **two** scrollers:
the inner one, plus `SidebarInset` with a max scroll of exactly 56px.

Scrolling the inner one to its end still left 56px hidden. Reaching it took a **second, separate
gesture** on the outer container, which also dragged the header off screen (`headerTop: -56`). On
touch this reads as "the page will not scroll to the bottom".

### 3. Tall dialogs were clipped with no scroll anywhere

`DialogContent` is `fixed top-1/2 -translate-y-1/2` with `max-height: none` and `overflow: visible`.
A dialog grown to 975px on the 844px viewport measured `top: -558` — the title and first fields
were off the top of the screen, the element could not scroll itself (`scrollHeight === clientHeight`),
and **no scroll container existed anywhere on the page** because the box is `position: fixed`.

Affected every dialog on the base component: create-workspace, `WorkspaceDeleteDialog`,
`TransferOwnershipDialog`, `TeamManager` invites, `SetupInstagramDialog`, `InstagramReconnectDialog`.
`ChoosePlan` was the only settings dialog that overrode it — and it used `90vh`, which on a real
phone measures the *large* viewport and so still overflows while the URL bar is showing.

## Solution

One scroll container per axis on mobile, and clearance from the bottom nav taken out of the scroll
container's **height** rather than its padding.

- `SidebarInset` caps at `max-h-[calc(100svh-3.5rem)]` on mobile so the box itself ends at the nav's
  top edge. Because it is `overflow-y-auto`, that also means no non-fixed descendant can paint under
  the nav — the clearance is now structural, not padding that hoped to be respected. `pb-14 md:pb-0`
  is gone. Desktop is untouched: `md:max-h-screen` still wins, and `md:pb-0` already zeroed the
  padding there.
- `settings/layout.tsx` uses `flex-1` instead of `h-full`, so the column takes the space left over
  after the header. Its default `min-height:auto` still lets it grow past the screen so the page
  scrolls. `md:flex-none` keeps the existing `md:h-[calc(100vh-88px)]` desktop sizing.
- `LayoutSettings` scrolls only from `md` up (`md:min-h-0 md:overflow-y-auto`). On mobile
  `SidebarInset` is the single scroller; on desktop, where `SidebarInset` is `md:overflow-hidden`,
  `LayoutSettings` remains the scroller exactly as before.
- `DialogContent` gains `max-h-[90dvh] overflow-y-auto` as a baseline. `dvh` (not `vh`) so a visible
  mobile URL bar counts against the limit. Callers that set their own `max-h-*` / `overflow-*` still
  win through `twMerge`.
- `ChoosePlan` switches to `max-h-[90dvh]` and drops the redundant `overflow-hidden`.

## Changes

> [!IMPORTANT]
> `apps/dashboard/src/components/ui/` and `apps/admin/src/components/ui/` are both **symlinks**
> into `packages/ui/src/components/ui/`. Editing `sidebar.tsx` or `dialog.tsx` through either app
> path changes the shared `@befroosh/ui` copy, so **the admin app gets these changes too**.

| File | Change |
|---|---|
| `packages/ui/src/components/ui/sidebar.tsx` | `SidebarInset`: `max-h-svh` → `max-h-[calc(100svh-3.5rem)]`; removed `pb-14 md:pb-0` |
| `packages/ui/src/components/ui/dialog.tsx` | `DialogContent`: added `max-h-[90dvh] overflow-y-auto` |
| `apps/dashboard/src/app/(Console)/settings/layout.tsx` | `h-full` → `flex-1` + `md:flex-none`; `md:min-h-0` on the inner row |
| `apps/dashboard/src/components/Layout/LayoutSettings.tsx` | `overflow-y-auto` → `md:min-h-0 md:overflow-y-auto` |
| `apps/dashboard/src/components/Settings/ChoosePlan.tsx` | `max-h-[90vh] overflow-hidden overflow-y-auto` → `max-h-[90dvh] overflow-y-auto` |

### Effect on the admin app

Admin renders the same shape — `SidebarInset` wrapping `Header` + `LayoutPage` + its own `NavBottom`
(`apps/admin/src/app/(main)/layout.tsx`) — and its `NavBottom` root class is byte-identical to the
dashboard's: `fixed right-0 bottom-0 left-0 z-50 h-14 … md:hidden`. The 3.5rem the cap subtracts is
therefore exactly right there too, so admin picks up the same fix rather than a regression. **This
was reasoned from the markup, not measured in a running admin build.**

## Verification

Chrome device mode, 390x844. Method: inject a 1600px block at the end of the page's content column,
scroll every scroller to its maximum, then compare the lowest non-fixed element's bottom edge against
the nav's top edge (788).

Every settings sub-page — scroller count went 2 → 1 (or stayed 1), and nothing sits under the nav:

| Page | scrollers | content bottom vs nav top | result |
|---|---|---|---|
| `/settings/workspace` | 1 | −20 | pass |
| `/settings/instagram` | 1 | −20 (was **+56, unreachable**) | pass |
| `/settings/card` | 1 | ≤0 (was **+56, unreachable**) | pass |
| `/settings/zarinpal` | 1 | 0 (was **+56, unreachable**) | pass |
| `/settings/subscription` | 1 (was 2) | 0 | pass |
| `/settings/profile` | 1 (was 2) | 0 | pass |
| `/settings/team` | 1 (was 2) | 0 | pass |

`SidebarInset` bottom is 788 on every one of them, exactly the nav's top edge, with
`main.scrollHeight - main.scrollTop - main.clientHeight === 0` at the end of the scroll.

Dialog, same viewport, grown past the screen: `max-height: 759.6px` (= 90dvh), `overflow-y: auto`,
`top: 42`, `bottom: 802`, nothing clipped above or below, and it scrolls itself by 266px.
Before the fix the same dialog measured `top: -558` with zero scrollable containers.

Regression checks on other Console routes (shared `SidebarInset`): `/automations` and `/orders`
measured 1 scroller and 0 overlap with the nav. `/directs` was confirmed structurally — `SidebarInset`
is `overflow-y-auto` and its bottom is exactly the nav's top edge, so descendants are clipped above
the nav — but was not confirmed visually.

Desktop (1920x935) on `/settings/subscription`: `SidebarInset` resolves `max-height: 935px` from
`md:max-h-screen` (the mobile cap does not leak) and stays `overflow-y: hidden`; `LayoutSettings` is
the single scroller and reaches its end with all content on screen.

`pnpm --filter front exec tsc --noEmit`: 210 errors vs 208 on the base branch. Diffed both lists —
the 2 extra are `Cannot find module '@/public/*.png'` in `explainFeaturesSmall.tsx` and
`megaMenuXl.tsx`, caused by the fresh worktree having no generated `next-env.d.ts` (which supplies
`next/image-types/global`). No error in any changed file; zero introduced by this change.

## Known gaps

- Other `vh`-based dialog caps outside settings were left alone: `app/(Learn)/learn/page.tsx`
  (`max-h-[90vh]`), `components/Global/HelpMeDialog.tsx` (`max-h-[92vh]`),
  `orders/components/cardToCard.dialog.tsx` and `orders/components/orderDetails.tsx`
  (`h-[90vh] max-h-[90vh]`). They have the same real-device URL-bar issue and should move to `dvh`.
- `LayoutPage`, `LayoutTable` and `LayoutCard` still declare `overflow-y-auto` unconditionally. That
  no longer strands content now that `SidebarInset` ends at the nav, but those routes still run a
  scroller nested inside another one on mobile.

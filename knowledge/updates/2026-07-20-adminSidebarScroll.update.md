# Sidebar Scrolls Its Own Content — 2026-07-20

## Problem

In the admin dashboard, opening a parent menu in the sidebar hid some items. The admin
sidebar has ~13 top-level items, and the `advanced` (`پیشرفته`) parent alone has 9
children. Once a parent was open, the menu grew taller than the sidebar and the extra
items were **cut off with no way to reach them** — no scrollbar, and the mouse wheel did
nothing.

Root cause: `SidebarContent` in `packages/ui/src/components/ui/sidebar.tsx` used
`overflow-hidden`. Upstream shadcn uses `overflow-auto` here; the value had been changed
at some point, which clips overflow instead of scrolling it. Note that `overflow-hidden`
still allows *programmatic* scrolling, so the element looked scrollable in code — but a
real user had no scrollbar and no wheel scroll, which is what made the items unreachable.

## Solution

Make `SidebarContent` scroll itself. Header (`SidebarHeader`) and footer (`SidebarFooter`)
are flex siblings, so they stay pinned while only the menu area scrolls.

Also scroll a newly-opened parent menu into view, so its children are visible immediately
rather than requiring a manual scroll.

## Changes

- `Front/packages/ui/src/components/ui/sidebar.tsx` — `SidebarContent`:
  - `overflow-hidden` → `overflow-y-auto` (the actual fix).
  - `overflow-x-hidden` — the submenu's `px-8` indent must not cause sideways scroll.
  - `overscroll-contain` — reaching the end does not scroll the page behind it.
  - `scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent` — matches the
    convention already used across the app (`LayoutPage`, leads, tasks, users). The
    `tailwind-scrollbar` plugin is already loaded in each app's `globals.css`.
  - `group-data-[collapsible=icon]:overflow-hidden` — restored from upstream; there is
    nothing to scroll in icon mode.
- `Front/apps/admin/src/components/nav-main.tsx` — `CollapsibleNavItem` scrolls itself
  into view when it opens (`scrollIntoView({ block: 'nearest' })`, so a menu that already
  fits does not move). Honors `prefers-reduced-motion`; `matchMedia` is optional-chained
  because jsdom does not implement it.

### Scope note (important)

`apps/*/src/components/ui` is a **symlink** into `packages/ui/src/components/ui`, so this
file is shared by **both** the admin app and the dashboard. The dashboard's
`ConsoleSidebar` uses `SidebarContent` the same way with no inner scroller of its own, so
it gets the same fix — same latent bug, no double scrollbar.

## Verification

Verified against a temporary harness route (11 items + a parent with 9 children) rendered
by a dev server on the worktree, then removed before commit.

- Computed style: `overflow-y: auto`, `overflow-x: hidden`, `overscroll-behavior: contain`.
- Content overflowed (`scrollHeight` 866 > `clientHeight` 785) and was scrollable.
- Opening the parent auto-scrolled it into view (`scrollTop` 78 of max 81) and all 9
  children became visible; header and footer stayed pinned.
- Real mouse-wheel scroll down and back up both worked.
- `tsc --noEmit` on admin: 119 errors both with and without the change (all pre-existing,
  none in the two touched files) — see `knowledge` note on admin's pre-existing tsc noise.
- `vitest run` on admin: 2 failed / 8 passed both with and without the change — the 2
  failures are pre-existing in `TemplateForm.test.tsx` (Persian-text query), unrelated.

No new user-facing strings, so no i18n keys were added.

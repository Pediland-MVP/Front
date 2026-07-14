# Sidebar Nav Pending Spinner (2026-07-14)

Replaces the sidebar nav icon with a spinning loading indicator while a clicked link's target route is still rendering, using Next.js's official `useLinkStatus` hook.

## Problem

Clicking a sidebar/bottom-nav link gave no feedback until the destination page finished rendering, so slow navigations (cold Turbopack compiles, un-prefetched dynamic routes) looked unresponsive.

## Solution

- `apps/dashboard/src/components/Layout/NavMain.tsx`: added a local `NavItemIcon` component that calls `useLinkStatus()` (must run in a child of `<Link>`, not the same component) and renders `CircleNotchIcon` with `animate-spin` while `pending`, else the item's normal Phosphor icon. Used inside the desktop sidebar's `<Link>` in place of the plain `<item.icon />`.
- `apps/dashboard/src/components/Layout/NavBottom.tsx`: same pattern for the mobile bottom nav's own `NavItemIcon`, since it renders its `<Link>` items separately from `NavMain`.
- Both keep `weight="duotone"` sizing/className conventions already used for icons in each component; the collapsible-trigger `<button>` items (no `<Link>`) and submenu text-only links are unaffected.

## Verification

- `npx tsc --noEmit` in `apps/dashboard`: no errors in either touched file (only pre-existing unrelated baseline errors elsewhere).
- `npx eslint` on both touched files: 0 errors.
- Manual: rendered `NavMain` in an isolated scratch route with artificially delayed target pages, confirmed the icon swaps to the spinning `CircleNotchIcon` on click and reverts once navigation resolves.

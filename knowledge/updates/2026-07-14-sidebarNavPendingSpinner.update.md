# Nav & Dashboard-Stat Pending Spinner (2026-07-14)

Replaces the icon on sidebar/bottom-nav links and the dashboard home stat/quick-action cards with a spinning loading indicator while the clicked link's target route is still rendering, using Next.js's official `useLinkStatus` hook.

## Problem

Clicking a sidebar link, a bottom-nav link, or a dashboard home stat card (e.g. "افزودن پیام خودکار", "پیام خودکار", "مخاطب") gave no feedback until the destination page finished rendering, so slow navigations (cold Turbopack compiles, un-prefetched dynamic routes) looked unresponsive.

## Solution

- `apps/dashboard/src/components/Layout/NavMain.tsx`: added a local `NavItemIcon` component that calls `useLinkStatus()` (must run in a child of `<Link>`, not the same component) and renders `CircleNotchIcon` with `animate-spin` while `pending`, else the item's normal Phosphor icon. Used inside the desktop sidebar's `<Link>` in place of the plain `<item.icon />`.
- `apps/dashboard/src/components/Layout/NavBottom.tsx`: same pattern for the mobile bottom nav's own `NavItemIcon`, since it renders its `<Link>` items separately from `NavMain`.
- `apps/dashboard/src/components/Console/Dashboard/DashboardStats.tsx`: added a local `AddAutomationIcon` component (same `useLinkStatus()` pattern) used inside the "افزودن پیام خودکار" card's `<Link href="/automations/add">`, since that card's icon is inlined directly in this file.
- `apps/dashboard/src/components/Console/Dashboard/ItemsStatisticCard.tsx`: since this component is already rendered as a child of `<Link>` by its parent (`DashboardStats.tsx`), `useLinkStatus()` is called directly inside it — no extra wrapper needed. Swaps the dynamically-looked-up Phosphor icon for `CircleNotchIcon` while pending. Covers the "پیام خودکار" (automations), "مخاطب" (contacts), "کالا/خدمت" (products), and "سفارش"/"فروش" (orders) cards.
- All spinners keep the `weight="duotone"` sizing/className conventions already used at each call site; the collapsible-trigger `<button>` sidebar items (no `<Link>`), submenu text-only links, and external `target="_blank"` links (Telegram/Instagram banners, connect-account button) are unaffected since there's no client-side route transition to track there.

## Verification

- `npx tsc --noEmit` in `apps/dashboard`: no errors in any touched file (only pre-existing unrelated baseline errors elsewhere).
- `npx eslint` on all touched files: 0 errors.
- Manual (sidebar/bottom-nav only): rendered `NavMain` in an isolated scratch route with artificially delayed target pages, confirmed the icon swaps to the spinning `CircleNotchIcon` on click and reverts once navigation resolves.
- Dashboard stat cards: not yet manually verified in-browser — pending user testing.

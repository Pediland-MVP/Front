# 2026-08-19 — Admin user-details page: mobile scroll fix

## Problem

On mobile, the admin `/users/[id]` page (user details) could not be scrolled far enough to
reach its own content: the "پیگیری‌ها (گفتگو)" / "فضاهای کاری" / "اشتراک‌ها" tabs panel (below
the subscription card) was unreachable — the page appeared to just stop scrolling partway down.

## Root cause

`Front/apps/admin/src/app/(main)/layout.tsx` passed `className="overflow-hidden"` to
`LayoutPage` **unconditionally** (no `md:` prefix). That class lands on `LayoutPage`'s inner
`_layout-page` div, which is also a `flex-1` flex item.

Per the CSS flexbox spec, a flex item with a non-`visible` `overflow` gets an **automatic
minimum size of 0** instead of a content-based one — so on mobile this div actually shrank to
fit the space `SidebarInset` gives it (`max-h-[calc(100svh-3.5rem)]`, see the comment on
`Front/apps/admin/src/components/ui/sidebar.tsx:296`) and clipped everything past that height.

`SidebarInset` itself is deliberately `overflow-y-auto` (not `overflow-hidden`) below `md:` —
it *is* the mobile scroll container, by design (see that same comment). `LayoutPage`'s forced
`overflow-hidden` fought that design: it clipped page content on mobile instead of letting it
overflow into `SidebarInset`'s own scroll box.

Most other `(main)` pages never hit this because they use `LayoutTable`, which is `h-full` +
its own `overflow-y-auto`, so it always fits the bounded box exactly (no clipping visible). The
user-details page is different: it's a stacked-column mobile layout (only becoming the
fixed-height split-scroll design at `lg:`, see its own `lg:h-[calc(100vh-40px)] lg:overflow-hidden`
wrapper) whose content genuinely exceeds the mobile viewport height.

## Fix

`Front/apps/admin/src/app/(main)/layout.tsx`: `overflow-hidden` → `md:overflow-hidden`,
matching `SidebarInset`'s own mobile/desktop scroll-mode breakpoint. Below `md:`, the page no
longer self-clips; `SidebarInset`'s `overflow-y-auto` scrolls the whole page as intended. Above
`md:`, behavior is unchanged (`SidebarInset` also switches to `md:overflow-hidden` +
`md:max-h-screen` there, and pages like `LayoutTable` provide their own bounded scroll).

## Verification

Reproduced live in Chrome at 500×667 (sub-`md`) against the real dev backend, logged in as an
existing admin: with the fix reverted (`git stash`), scrolling the user-details page moved
almost nothing — the tabs panel stayed unreachable. With the fix restored, the same scroll
reached the full "پیگیری‌ها" tab content (task list + add-task form) at the bottom of the page.
`pnpm --filter admin exec tsc --noEmit`: 115 pre-existing errors (none in the touched file, none
introduced).

**Not deployed.** Frontend-only, no backend/API change, no i18n keys added.

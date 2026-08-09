# Workspace Profile Chip (2026-08-07)

## Problem

The sidebar had no at-a-glance identity for the current workspace — just
the app logo, then straight into the nav list. Users switching between
workspaces had no quick visual cue (name, connected Instagram avatars) for
which workspace they're currently in, short of opening the full workspace
drawer.

## Solution

Added a pill-shaped "Workspace Profile Chip" under the logo at the top of
the desktop sidebar, above the nav items. It shows the current workspace's
name, an avatar (or overlapping avatar group, or fallback initial) built
from its connected Instagram accounts, and a text summary (handle if
exactly one account, otherwise an accounts-connected count / no-account
message). The whole chip opens the existing workspace-switcher drawer
(`WorkspaceDrawer`) on click — no new switching logic was written, it
reuses the same drawer `NavBottom`'s mobile profile button already opens.

Avatar states:
- 0 accounts: fallback circle with the workspace name's first letter,
  background color deterministically hashed from the workspace id (new
  `utils/avatarColor.ts`, no library).
- 1 account: single avatar with the account's profile picture (Radix
  `AvatarImage` auto-falls back to the initial on load failure).
- 2 accounts: two overlapping avatars (logical `-ms-2` margin so it mirrors
  correctly in RTL without a `space-x-reverse` hack).
- 3+ accounts: first two avatars overlapping plus a `+N` badge for the
  rest.

Data comes from the existing `useWorkspaces()` + `usePermissions()` hooks
(same cached SWR request already used by `NavBottom`/`UserDetailsCard`/
`WorkspaceDrawerContent`) — no new API calls. A skeleton pill renders while
workspaces are loading or the current workspace isn't resolved yet.

- Follow-up copy pass: `WorkspaceProfileChip.tsx`'s subtitle no longer shows
  `@username` for the single-account case — it always renders the
  count-based `accountsConnected`/`noInstagramConnected` summary regardless
  of account count.
- Follow-up copy pass 2: dropped the subtitle line entirely — the chip now
  shows only the avatar(s), the workspace name, and the chevron. Removed
  the now-fully-unused `accountsConnected`/`noInstagramConnected` i18n
  keys and simplified the loading skeleton to a single line to match.

## Changes

- `apps/dashboard/src/utils/avatarColor.ts` (new): deterministic
  seed→Tailwind-color hash for fallback avatars.
- `apps/dashboard/src/components/Layout/WorkspaceProfileChip.tsx` (new):
  the chip component, wraps itself in the existing `WorkspaceDrawer`.
- `apps/dashboard/src/components/Layout/ConsoleSidebar.tsx`: `SidebarHeader`
  switched from a single `flex-row` logo row to its default column stack
  (logo row, then the new chip below it).
- `apps/dashboard/src/messages/{fa,en}/Console.json`: new
  `Console.Sidebar.{accountsConnected,noInstagramConnected}` keys.
- Follow-up styling pass: chip switched from a `rounded-full` pill with a
  glow shadow to `rounded-md` + `border-dashed border-violet-300/70` +
  `bg-violet-100`, matching `NavMain`'s own active/hover nav-item styling
  (`packages/ui` sidebar menu-button tokens) instead of inventing a new
  look.
- Follow-up responsive-switcher pass:
  `apps/dashboard/src/components/Console/WorkspaceDrawer.tsx` now branches
  on `useIsMobile()` (the same hook `packages/ui`'s `SidebarProvider` uses)
  — mobile keeps the existing bottom `Drawer`, desktop now opens a centered
  `Dialog` instead. `WorkspaceDrawerContent.tsx` gained a `hideLogout?:
  boolean` prop (default `false`, so `NavBottom`'s mobile trigger is
  unaffected); the desktop `Dialog` path passes `hideLogout` so the
  switcher's logout button only shows on mobile.
  `WorkspaceDrawerContent.test.tsx` gained two tests for the new prop.
- Follow-up sizing pass: the desktop dialog was too small
  (`max-w-sm`/288px-tall list, same cramped size as mobile). `WorkspaceDrawer.tsx`'s
  `DialogContent` widened to `max-w-2xl`; `WorkspaceDrawerContent.tsx`
  gained an `isDialog?: boolean` prop (mobile `Drawer` path doesn't pass
  it) that swaps the workspace list's scroll cap from `max-h-72` to
  `max-h-[32rem]` and gives the content more breathing-room padding
  (`px-6 pt-6 pb-8` vs the drawer's `px-4 pb-6`).
- Follow-up content trim: removed the user-details card (name, mobile/
  email, edit-profile button, avatar — `useUser`, `PencilIcon`,
  `UserCircleIcon`, `Avatar*`) and the logout button (`logoutHandler`,
  `useLogout`, `useSubscriptionStore`, `LogOutIcon`) from
  `WorkspaceDrawerContent.tsx` entirely, on both mobile and desktop — the
  short-lived `hideLogout` prop from the earlier desktop-only pass was
  removed again since logout is now gone everywhere, not just on desktop.
  Also dropped the now-unused `Console.WorkspaceDrawer.editProfile` i18n
  key (`Console.Sidebar.logout` is kept — still used by
  `UserDropdownMenu.tsx`). `WorkspaceDrawerContent.test.tsx` updated to
  match (removed profile/edit-profile/logout-visibility tests, added one
  asserting logout never renders).

## Verification

Implemented directly on `merged-admin` (Front's currently checked-out
branch) per explicit instruction — not a spec/worktree flow.
`WorkspaceDrawerContent.test.tsx` covers the new `hideLogout` prop (run
pending). No automated tests for `WorkspaceProfileChip.tsx` or the
responsive Drawer/Dialog switch itself. Not yet manually verified in a
running dev server (should be checked in-browser for both `fa`/RTL and
`en`/LTR, the 0/1/2/3+ account avatar states, and the mobile-drawer vs
desktop-dialog switch, before this is considered done).

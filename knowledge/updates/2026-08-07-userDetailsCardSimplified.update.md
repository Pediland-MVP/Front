# Sidebar User Details Card Simplified (2026-08-07)

Related to `2026-08-07-workspaceProfileChip.update.md` (same sidebar
redesign): with the new `WorkspaceProfileChip` now handling workspace
identity/switching at the top of the sidebar, the footer `UserDetailsCard`
no longer needs to duplicate workspace name, the workspace switcher
popover, connected Instagram accounts, or subscription remaining-days —
it's now a plain "your account" card.

## Problem

`UserDetailsCard.tsx` (rendered in `ConsoleSidebar.tsx`'s `SidebarFooter`)
packed in subscription status, a workspace-switcher popover, a per-account
Instagram list with remaining days, and a progress bar, on top of the
user's own name/contact/logout row. Most of that is now redundant with the
new sidebar chip, and the requested new footer is much simpler: profile
icon + name, mobile/email, and two equally-styled action buttons.

## Solution

Rewrote `UserDetailsCard.tsx` to three rows:
1. Profile icon (`UserCircleIcon` fallback avatar) + `firstname lastname`.
2. `mobile` or `email`.
3. Two `variant="outline" size="sm"` buttons of the same color: "ویرایش"
   (navigates to `/settings/profile`) and "خروج" (`ButtonLoading`, same
   `logoutHandler`/`useSubscriptionStore.getState()` clear + `/auth`
   redirect logic as before).

Dropped: the workspace-switcher popover (`Popover*`, `handleSwitchWorkspace`,
`ArrowsClockwiseIcon`, `CheckIcon`), the Instagram accounts list
(`sortedInstagrams`, `PlugsConnectedIcon`/`PlugsIcon`), subscription
progress (`ProgressLine`, `hasOnlyFreeCredit`, `getRemainingDays`,
`SubscriptionStatusEnum`, `activeSubscription`/`expiredSubscription`), and
the now-unused `usePermissions`/`useWorkspaces`/`usePathname`/`useMemo`
imports.

## Changes

- `apps/dashboard/src/components/Layout/UserDetailsCard.tsx`: rewritten as
  described above.
- `apps/dashboard/src/messages/{fa,en}/Console.json`: new
  `Console.Dashboard.edit` key ("ویرایش" / "Edit"); reuses the existing
  `Console.Sidebar.logout` key for the logout button.

- Follow-up polish pass: swapped the fallback avatar icon from
  `UserCircleIcon` (its glyph draws its own outer circle, which visibly
  clashed with the `Avatar`'s own circular clip) to a plain `UserIcon`
  silhouette on a solid `bg-primary/10` circular fallback background — the
  same "colored circle + icon/initial" treatment used elsewhere (e.g.
  `WorkspaceProfileChip`'s fallback avatars), avoiding the double-circle
  look. Also grew the avatar (`h-9 w-9` → `h-10 w-10`) and the card's
  internal spacing (`gap-3`/`p-3` → `gap-3.5`/`p-3.5`, row gaps `gap-2` →
  `gap-2.5`) for more breathing room.

- Follow-up layout pass: mobile/email was its own skinny full-width `text-xs`
  row below the avatar row, reading as too small and making the card's
  height feel uneven. Moved it under the name instead, both inside one
  `min-w-0 flex-1` text block next to the avatar (name `text-sm font-semibold`,
  contact `text-sm text-muted-foreground` — same size, muted color for
  hierarchy), avatar grown to `h-11 w-11`.

- Follow-up color pass: the card's `CardSimple` wrapper was
  `border-blue-300/70` + a white gradient, out of step with the rest of the
  sidebar's violet identity (`NavMain`'s active/hover nav items,
  `WorkspaceProfileChip`, both `border-violet-300/70` + violet fill).
  Recolored to `border-dashed border-violet-300/70 bg-linear-to-t
  from-violet-50 to-white/50` to match. Button colors (`variant="outline"`,
  the shared neutral-gray Button token) were left as-is — out of scope,
  used app-wide.

- Follow-up "no frame" pass: the violet-tinted `CardSimple` box was still
  wrong per the user, and a follow-up visual comparison (4 options,
  rendered in-context against the real sidebar chrome) confirmed the
  wanted direction was to drop the card look entirely. Removed
  `CardSimple`/`CardContent` — the component briefly rendered directly on
  the sidebar background: a `SidebarSeparator` hairline divider above the
  profile block, no border, no fill.
- The mockup's sidebar frame was itself wrong (flat gray instead of the
  real `packages/ui/src/components/ui/sidebar.tsx` sidebar-inner
  background, `bg-linear-to-t from-white/85 to-violet-50`) — fixed the
  mockup, republished, and confirmed the "no frame" version was already
  correct against the real gradient (it has no background override, so it
  inherits whatever's behind it either way).
- Final pick, after seeing the corrected mockup: option B, not "no
  frame" — flat violet, no gradient, matching `NavMain`'s active nav-item
  treatment exactly (`rounded-md border border-dashed
  border-violet-300/70 bg-violet-100`). The component is a boxed card
  again (plain `div`, not `CardSimple`/`CardContent`), and the avatar
  fallback switched from a tinted `bg-primary/10 text-primary` to a solid
  `bg-primary text-white` circle to match option B's avatar treatment.

- Final pass: "flat violet card" (option B) still wasn't right — the user
  wanted it to actually look like the sidebar's own menu items, not a
  boxed card at all. Dropped the card entirely: "ویرایش" and "خروج" are
  now real `SidebarMenuButton`/`SidebarMenuItem`/`SidebarMenu` rows (the
  same primitives `NavMain` uses), styled with the exact same className
  recipe as `NavMain`'s inactive nav items (`border border-dashed
  border-transparent`, hover → `border-violet-300/70 bg-violet-100
  text-primary`) — full-width icon+label rows, not side-by-side pill
  buttons. The profile info row (avatar/name/contact) stays a plain,
  non-interactive row above the two menu rows, no border or fill.

- Follow-up layout tweak: `SidebarMenu` switched from its default stacked
  column to `flex-row`, with each `SidebarMenuItem` set `flex-1` and its
  button content `justify-center` — "ویرایش"/"خروج" now sit side by side
  as two equal-width menu-item rows instead of stacked.

## Verification

Implemented directly on `merged-admin` per the same explicit
direct-to-branch instruction as the workspace chip work. No automated
tests (none existed for this component before either). Not yet manually
verified in a running dev server.

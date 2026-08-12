# Mobile Workspace Drawer's "افزودن پیج" Opens the Setup Dialog (2026-08-11)

Related: `2026-08-09-settingsAddInstagramGate.update.md` (the gate this button
now goes through), `2026-08-10-instagramWorkspacePickerWizard.update.md`.

## Problem

The workspace drawer shown in mobile navigation
(`WorkspaceDrawerContent.tsx`) has an "افزودن پیج" (add page) button. It sent
the user straight to `/connect` — the same shortcut `/settings/instagram`'s
own **افزودن اکانت** button used to take before
`2026-08-09-settingsAddInstagramGate.update.md` closed it. That meant a user
with an unbound paid plan (or no unused coverage at all) tapping this button
skipped `SetupInstagramDialog` entirely and only hit the gate one hop later,
on `/connect` itself — same wasted-page-load shape the linked doc already
fixed for the desktop entry point, just reintroduced through this second one.

Requested fix: route through `/settings/instagram` and open the same add
dialog there, driven by a query param.

## Solution

New `AUTO_OPEN_ADD_PARAM` (`openAdd`) query param, exported from
`useAddInstagramGate.ts` alongside the hook both entry points already share.
The drawer button now pushes to `/settings/instagram?openAdd=1` instead of
`/connect` directly. On mount, once `isAddBlocked` resolves out of its
loading state, the page runs the exact same branch its own Add button's
`onClick` would: `requiresSetupDialog` opens `SetupInstagramDialog`,
otherwise it pushes on to `/connect` — so there is one decision, not two
copies of it drifting apart.

A `useRef` guard (`autoOpenHandled`) makes sure this only fires once. If
`isAddBlocked` is still `true` after the gate resolves (hit the account
limit, missing `instagram:manage`), the effect no-ops on every re-render
instead of ever forcing the dialog open — matching what tapping a disabled
Add button would do.

## Changes

- `apps/dashboard/src/hooks/useAddInstagramGate.ts` — exported
  `AUTO_OPEN_ADD_PARAM = 'openAdd'`.
- `apps/dashboard/src/app/(Console)/settings/instagram/page.tsx` — new
  `autoOpenHandled` effect that reads the param and replays the Add button's
  branch once the gate is no longer loading.
- `apps/dashboard/src/components/Console/WorkspaceDrawerContent.tsx` — the
  add-page button now pushes to `/settings/instagram?openAdd=1`.
- Tests: `WorkspaceDrawerContent.test.tsx` updated for the new destination;
  `settings/instagram/page.test.tsx` — added `useRouter` to the
  `next/navigation` mock and a new describe block covering: dialog opens
  when gated, pushes to `/connect` when not gated, waits while the gate is
  still loading, no-ops without the param.

## Verification

`vitest run "settings/instagram/page.test.tsx" WorkspaceDrawerContent.test.tsx`
— **32 passed** (16 + 16).

Not smoke-tested in a browser.

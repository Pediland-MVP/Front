# 2026-08-19 — Charge & view subscriptions from the workspace details page

Branch: `feat/workspace-subscription-charge` (worktree, off `main`). Backend counterpart:
`Back/knowledge/updates/2026-08-19-workspaceSubscriptionCharge.update.md`.

## Problem

The admin user-details page (`users/[id]/page.tsx`) already has a full paginated subscription
list + invoices + a "شارژ دستی حساب مشتری" (manual charge) dialog. The workspace-details page
(`workspaces/[id]/page.tsx`) only showed a read-only summary of the single *latest* subscription,
with no way to see history/invoices or charge the workspace directly.

## Solution

- Extracted the user-details page's local `SubscriptionCard` component into
  `components/customer/SubscriptionCard.tsx` so both pages can render it. Made the "فضای کاری"
  (workspace name) row conditional on `subscription.workspaceName` being present — the workspace
  page's own subscriptions endpoint doesn't return it (redundant, since the page already is that
  workspace).
- Made `AddSubscriptionDialog`'s `workspaceId` prop optional. When passed, the dialog skips its
  "which of this user's owned workspaces" fetch (`/users/:id/workspaces`) and picker field
  entirely, and uses the `workspaceInstagrams` prop instead of workspace-derived instagram options
  for the page picker. User-details page usage (no `workspaceId` passed) is unchanged.
- `workspaces/[id]/page.tsx`: replaced the read-only single-subscription sidebar card with a full
  paginated list (`GET /workspaces/:id/subscriptions?page&limit=5`, new backend endpoint) using the
  shared `SubscriptionCard`, plus a "شارژ دستی" button wiring the shared `AddSubscriptionDialog`
  with `userId={meta.owner.id}` and `workspaceId={meta.id}`.
- Added `Workspaces` namespace i18n keys (`fa.json`): `subscriptions`, `manualCharge`,
  `noSubscriptionsList`, `previousPage`, `nextPage`, `pageOf`.

## Changes

- `src/components/customer/SubscriptionCard.tsx` — new, extracted from `users/[id]/page.tsx`.
- `src/components/customer/AddSubscriptionDialog.tsx` — `workspaceId`/`workspaceInstagrams` props
  added; workspace picker + its preselect effect now skip when `workspaceId` is locked.
- `src/app/(main)/users/[id]/page.tsx` — now imports the shared `SubscriptionCard` instead of
  defining it locally.
- `src/app/(main)/workspaces/[id]/page.tsx` — subscriptions section rewritten (list + charge
  button + pagination); wires `AddSubscriptionDialog`.
- `src/messages/fa.json` — new `Workspaces` keys (see above).

## Verification

- `apps/admin` scoped `tsc --noEmit`: no new errors introduced by any touched file (compared
  line-for-line against unmodified `main` — the pre-existing `Badge`/`children` type errors on
  this same page exist on `main` too, just at different line numbers).
- Manual end-to-end in the browser (dev server, throwaway admin + throwaway dev-DB subscription,
  both cleaned up after): opened a real workspace's details page, confirmed the paginated list +
  pagination controls render, opened the charge dialog (confirmed the workspace picker is skipped
  and the workspace's own Instagram page is pre-populated), completed a charge, confirmed the toast
  and the new "active" subscription row landed in Postgres with the correct `workspaceId`.

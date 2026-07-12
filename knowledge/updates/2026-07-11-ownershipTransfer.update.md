# Workspace Ownership Transfer — Dashboard UI (2026-07-11)

Frontend for the workspace ownership-transfer feature. Backend reference:
`Back/knowledge/updates/2026-07-11-ownershipTransfer.update.md`; endpoint contract:
`Back/knowledge/front-back-relations.md` → "Workspace Ownership Transfer".
Design spec: `docs/superpowers/specs/2026-07-11-workspace-ownership-transfer-design.md`.

## Problem

A workspace **owner** had no UI to hand the workspace (and all its data) to another
**verified** user. The backend now exposes a two-sided, OTP-verified transfer flow; the
dashboard needed:

- an owner-only entry point on the workspace page,
- a multi-step dialog (recipient **email or mobile** typed **twice** → choose mode → enter OTP),
- a **stay** vs **leave** choice, with a warning before "transfer only" (stay), and
- a banner for the **recipient** to accept or reject an incoming transfer.

## Solution

New types + two SWR hooks + two components, wired into the existing workspace page. All
text is i18n (`Settings.OwnershipTransfer` namespace + `ERROR_CODES`); the mobile and OTP
inputs follow the Persian-first digit-safe convention (`onInput={onInputP2EHandler}`).

- **`types/ownershipTransfer.ts`** — `OwnershipTransferMode`, `IncomingTransfer`,
  `ActiveTransfer`.
- **`hooks/useIncomingTransfers.ts`** — `useSWR('/ownership-transfers/incoming')`,
  unwraps `PaginatedResult.items`; returns `{ transfers, count, isLoading, mutate }`.
- **`hooks/useActiveTransfer.ts`** — `useSWR('/workspaces/:id/ownership-transfer/active')`,
  unwraps `ResponseMessage.data`; returns `{ activeTransfer, isLoading, mutate }`.
  (Created for a future "owner sees pending status" affordance; not yet wired into a view.)
- **`components/Settings/TransferOwnershipDialog.tsx`** — owner flow, now
  **resume-aware**. On open it reads `useActiveTransfer(workspaceId)`:
  - **no active transfer** → step `form`: the recipient's **email OR mobile** typed
    twice (client-side `isMobile || isEmail` + case-insensitive match check), a red
    **transfer-and-leave** button and an outline **transfer-only** button (which opens
    an `AlertDialog` "you stay as a full-access admin, not the owner" warning first).
    The field is a **text** input; a local `p2eKeepText` maps Persian/Arabic digits to
    latin **without stripping letters** (the shared `onInputP2EHandler` strips every
    non-digit and would destroy an email). Sends `targetIdentifier` /
    `targetIdentifierConfirm`.
  - **`pending_otp`** → jumps straight to step `otp` with the transfer preset, so an
    owner who left during the OTP step finishes it instead of hitting
    `TRANSFER_ALREADY_ACTIVE`.
  - **`pending_acceptance`** → step `sent`: a read-only "already sent to {name},
    awaiting acceptance" panel (no doomed re-initiate).
  - The `otp` and `sent` steps show a **recipient block** (`recipient_label` + name +
    mobile and/or email) — from `activeTransfer.toUser` on resume, or the typed
    identifier on a fresh initiate. Step `otp` is a 5-digit `InputOTP` that auto-submits
    and toasts SMS-vs-email by the returned `channel`. Errors via `t_ec(...)`.
  - The `otp` step also has a **resend** button (`POST .../:transferId/resend-otp`) with a
    **60s countdown** (`resend_in {seconds}` → `resend_otp`) mirroring the backend cooldown.
    On expiry the confirm call returns `OTP_EXPIRED` ("code expired — resend") instead of the
    misleading `INVALID_OTP`; a too-soon resend returns `OTP_RESEND_COOLDOWN` (429).
- **`components/Settings/IncomingTransferBanner.tsx`** — recipient flow. Renders nothing
  when there are no incoming transfers; otherwise one card per transfer with **Accept**
  (behind an `AlertDialog` confirm → `window.location.reload()` so the whole app re-reads
  the new ownership) and **Reject** (revalidates the list via `mutate`).
- **`components/Settings/PendingTransferNotice.tsx`** — owner recovery. Uses
  `useActiveTransfer(workspaceId)`; renders nothing unless the owner has a live outgoing
  transfer. Shows a status-aware notice (`pending_otp` → "you still owe the OTP" /
  `pending_acceptance` → "sent to {name}, awaiting acceptance") and a **Cancel** button
  (behind an `AlertDialog` confirm) that calls `POST .../:transferId/cancel`, then
  revalidates. This closes the abandon/expire dead-end — an owner who mistypes or closes
  the OTP step can cancel and retry immediately instead of waiting out the 72h expiry.
- **`app/(Console)/workspace/page.tsx`** — renders `<IncomingTransferBanner />` at the top;
  adds an **owner-only** transfer button (gate is `activeWorkspace.ownerId === userId`
  only — unlike delete, transfer **is** allowed for personal workspaces); renders
  `<TransferOwnershipDialog workspaceId={activeWorkspace.id} onCompleted={mutate} />`.

## Changes

- New: `types/ownershipTransfer.ts`, `hooks/useIncomingTransfers.ts`,
  `hooks/useActiveTransfer.ts`, `components/Settings/TransferOwnershipDialog.tsx`,
  `components/Settings/IncomingTransferBanner.tsx`,
  `components/Settings/PendingTransferNotice.tsx`.
- Modified: `app/(Console)/workspace/page.tsx` (button + banner + pending-notice + dialog +
  state; the dialog's `onCompleted` also revalidates the active-transfer SWR key so the
  notice appears immediately).
- i18n: `Settings.OwnershipTransfer` namespace + `Settings.Workspace.transfer_ownership_button`
  in `messages/fa.json` (+ `en.json` mirror); 13 new keys in `messages/fa/ErrorCodes.json`
  (+ `en/ErrorCodes.json`) covering every code the backend can return
  (`TRANSFER_ALREADY_ACTIVE`, `TRANSFER_NOT_FOUND`, `WORKSPACE_TRANSFER_NOT_OWNER`,
  `TRANSFER_NOT_RECIPIENT`, `TRANSFER_NOT_PENDING`, `TRANSFER_MOBILE_MISMATCH`,
  `TRANSFER_EXPIRED`, `TARGET_USER_NOT_FOUND`, `CANNOT_TRANSFER_TO_SELF`,
  `OWNER_NO_OTP_CHANNEL`, `OWNER_CHANGED`, `INVALID_OTP`, `USER_NOT_VERIFIED`).

## Verification

- `cd apps/dashboard && pnpm exec tsc --noEmit` after each task → **0 new errors** in the
  created/modified files (the dashboard's pre-existing, unrelated tsc errors are ignored
  by its `next build` config).
- `pnpm build` (dashboard) → compiles.
- JSON validity of all four message files verified via `node -e "require(...)"`.
- Endpoint paths, `initiate` DTO regex, OTP length (5), and response unwrapping
  (`items` / `data` / `data.data`) cross-checked against the `core` controller/DTOs.
- Manual end-to-end smoke (owner initiates → OTP → recipient accepts → ownership moves;
  and leave vs stay) requires a running `core` on this branch — to be exercised against
  `back2`/local before release.

## Notes / follow-ups

- The owner **cancel** affordance (`PendingTransferNotice`) was added after final review
  flagged the abandon/expire dead-end — an owner can also cancel a pending transfer in-app
  and start over. (The OTP expires after 10 min while the transfer row lives 72h.)
- **OTP resend** (added 2026-07-12) closes the primary dead-end: while a `pending_otp`
  transfer is alive, the owner refreshes the code in-place via the resend button instead of
  cancelling + re-initiating. 60s cooldown, `OTP_EXPIRED` vs `INVALID_OTP` messaging. Cancel
  remains the escape hatch for "wrong recipient" / start-over.
- **Connect-flow entry point** (added 2026-07-12): a recipient who is registered and
  verified but hasn't connected Instagram yet (State B, locked on `/connect`) previously had
  no way to see an incoming ownership-transfer request — `IncomingTransferBanner` only
  renders inside `/workspace`, which they can't reach. Mirrors the existing pending-invitation
  picker pattern exactly:
  - New page `app/(Auth)/auth/onboarding/transfer/page.tsx` — lists incoming transfers
    (`useIncomingTransfers`) with the same Accept (`AlertDialog` confirm →
    `window.location.href = '/'` for a full re-evaluation) / Reject actions as
    `IncomingTransferBanner`, plus a Skip button that sets
    `sessionStorage['ownershipTransferDismissed'] = '1'` and returns to `?returnTo`
    (defaults to `/connect`).
  - `components/Providers/AuthProvider.tsx` — added a second SWR fetch
    (`/ownership-transfers/incoming`, connect-flow-only, gated the same way as the
    invitations fetch) and a `connectFlowTransferDest` alongside the existing
    `connectFlowPickerDest`. Combined into `connectFlowPendingDest =
    connectFlowPickerDest ?? connectFlowTransferDest` — **pending invitations still take
    priority** over a pending transfer; a connect-flow user is bounced to
    `/auth/onboarding/transfer` only once there are no more pending invitations to review.
    Every place that previously redirected a connect-flow user straight to `/connect` now
    redirects to `connectFlowPendingDest ?? '/connect'` instead.
  - i18n: new `Auth.OwnershipTransfer` namespace (`title`, `description`, `no_transfers`,
    `continue`) in `messages/fa/Auth.json` + `en/Auth.json`; the page reuses
    `Settings.OwnershipTransfer` for the per-card accept/reject copy so there's a single
    source of truth for that wording.
  - No backend change needed — `GET /ownership-transfers/incoming` and the
    accept/reject endpoints were already workspace-context-free (`AuthGuard('jwt') +
    UserVerifyGuard` only, no workspace permission guard), so they work identically for a
    user with no active workspace selected.

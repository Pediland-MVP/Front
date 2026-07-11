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
- a multi-step dialog (target mobile typed **twice** → choose mode → enter OTP),
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
- **`components/Settings/TransferOwnershipDialog.tsx`** — owner flow. Step `form`: mobile
  typed twice (client-side `^09\d{9}$` + match check), a red **transfer-and-leave** button
  and an outline **transfer-only** button; the transfer-only button opens an
  `AlertDialog` warning ("you stay as a full-access admin, not the owner") before firing.
  On `initiate` success → step `otp`: a 5-digit `InputOTP` that auto-submits on complete
  and shows an SMS-vs-email toast based on the returned `channel`. Errors surface via
  `t_ec(e.response.data.code)`.
- **`components/Settings/IncomingTransferBanner.tsx`** — recipient flow. Renders nothing
  when there are no incoming transfers; otherwise one card per transfer with **Accept**
  (behind an `AlertDialog` confirm → `window.location.reload()` so the whole app re-reads
  the new ownership) and **Reject** (revalidates the list via `mutate`).
- **`app/(Console)/workspace/page.tsx`** — renders `<IncomingTransferBanner />` at the top;
  adds an **owner-only** transfer button (gate is `activeWorkspace.ownerId === userId`
  only — unlike delete, transfer **is** allowed for personal workspaces); renders
  `<TransferOwnershipDialog workspaceId={activeWorkspace.id} onCompleted={mutate} />`.

## Changes

- New: `types/ownershipTransfer.ts`, `hooks/useIncomingTransfers.ts`,
  `hooks/useActiveTransfer.ts`, `components/Settings/TransferOwnershipDialog.tsx`,
  `components/Settings/IncomingTransferBanner.tsx`.
- Modified: `app/(Console)/workspace/page.tsx` (button + banner + dialog + state).
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

- There is currently **no cancel button** for a pending transfer, though the backend
  exposes `POST /workspaces/:id/ownership-transfer/:id/cancel`. Not in the design's
  frontend scope; an owner aborts today only by letting the request expire. Candidate
  follow-up (pair it with `useActiveTransfer`, which is already built).

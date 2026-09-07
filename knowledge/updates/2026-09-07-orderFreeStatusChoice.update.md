# Free order status choice in the status select — 2026-09-07

Frontend half of `Back/knowledge/updates/2026-09-07-orderFreeStatusChoice.update.md`, which carries
the state machine, the stock invariant and the reasoning. Read that one first — almost everything
load-bearing here is enforced on the backend.

API contract row updated in [`knowledge/front-back-relations.md`](../front-back-relations.md).

## Problem

Reported by the seller: *"You prevent user to change the status forward into sent and it should
select processing first, this guard should be deleted. The user can select each status he wants for
physical and digital except sent for digital."*

`ACTIONS_BY_STATUS` in `orderTransitions.ts` mirrors Back's `ORDER_TRANSITIONS`, and both were
forward-only:

| Status | Offered targets |
|---|---|
| `awaiting_review` | `processing`, `cancelled` |
| `processing` | `sending`, `completed`, `cancelled` |
| `sending` | `completed`, `cancelled` |
| `completed` | *(none — the select was disabled)* |
| `cancelled` | *(none — the select was disabled)* |

So an order already handed to a courier could not be set to «ارسال شده» in one step, and a
mis-clicked «تکمیل شده» or «لغو شده» was permanent.

## Solution

Every status offers every other status. The only omission is «ارسال شده» on a **digital** order,
which `actionsFor`'s existing `kind === 'digital'` filter already handled — and which now matters
from four source statuses instead of one, since `ship` is offered from all of them.

Nothing about *why* the select is safe changed: it still only ever offers transitions the API will
accept, and `actionForTransition` still resolves the (from, to) pair back to the action so the right
confirmation dialog opens. What changed is that the table it reads is wider, plus one new action.

### `revert` — the new backward move

`revert` (`→ awaiting_review`) is the first backward transition the order machine has. It gets its
own `ConfirmActionDialog` rather than sharing one, because its consequence differs by where the
order is now: from `processing`/`sending`/`completed` the backend restocks every line, from
`cancelled` nothing moves. The copy says both rather than promising one, since the dialog is reached
from all four.

### Two smaller consequences

- **`targetStatusesFor` now sorts.** Its order used to fall out of `ACTIONS_BY_STATUS`, whose rows
  were short and already in lifecycle order. With four actions per row in a table order that is an
  implementation detail, deriving the select's order from it would have shuffled the list depending
  on which order the seller opened. A `TARGET_ORDER` constant fixes the positions, and the result is
  deduped — `reject` and `cancel` both target `cancelled`.
- **No status is terminal any more**, so `hasAnyAction` is always true and the "this order is
  closed" line never renders. The `isTerminal` branch stays in `OrderStatusUpdater` purely as a
  guard against an empty Radix select if the table is ever narrowed again.

## Changes

| File | Change |
|---|---|
| `src/components/Commerce/Orders/orderTransitions.ts` | `ACTIONS_BY_STATUS` widened to every status; `revert` added to `OrderActionName` and `TARGET_BY_ACTION`; new `TARGET_ORDER`; `targetStatusesFor` sorts and dedupes |
| `src/components/Commerce/Orders/orderTransitions.test.ts` | Rewritten around the new table: every-status-reaches-every-other, digital-never-ships-from-any-source, lifecycle ordering, no duplicate targets, `actionForTransition` null only when nothing changes (25 tests) |
| `src/components/Commerce/Orders/OrderStatusUpdater.tsx` | `revert` confirmation dialog; `isTerminal` documented as defensive |
| `src/components/Commerce/Orders/OrderStatusUpdater.test.tsx` | Terminal-order test inverted; new tests for the cancelled-order select, the revert confirmation, and digital-never-ships-from-cancelled |
| `src/components/Commerce/Orders/OrderDetailPage.tsx` | Pulls `revert` from the hook into the `onAction` map |
| `src/components/Commerce/Orders/OrderDetailPage.test.tsx` | "no status control when nothing is left" inverted — a settled completed order keeps its slot |
| `src/hooks/useCommerceOrder.ts` | `revert: () => run('revert')` (no body) |
| `src/messages/fa.json` | New `Commerce.Orders.dialogs.revert.*`; `dialogs.complete.description` no longer claims completion is irreversible; `statusUpdate.hint` says any status may be chosen |
| `src/messages/fa/ErrorCodes.json` | New `COMMERCE_INSUFFICIENT_STOCK_FOR_STATUS` (also added to `fa.json`'s shadowed copy for consistency) |

Per §8, only `fa.json` gets the new keys — `en.json` is translated later.

### Stale copy this corrected

`dialogs.complete.description` said «این تغییر برگشت‌پذیر نیست» ("this change cannot be undone").
That stopped being true the moment `completed` gained outbound transitions, and it would have been
the most misleading string on the screen — a seller reading it would not have looked for the way
back that now exists.

## Verification

- `pnpm exec vitest run src/components/Commerce/Orders src/hooks` — **19 files, 197 tests, all
  passing** (was 190).
- `pnpm exec tsc --noEmit` — **zero errors in any touched file.** The app's pre-existing `src/`
  errors (Badge props, the zod-3/zod-4 `zodResolver` mismatch) are unchanged and unrelated.
- **Not clicked through in a browser.** Nobody has opened the widened select on a real order, and
  the revert dialog's restock warning has not been read against an actual `processing` order.

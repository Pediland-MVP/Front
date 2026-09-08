# 2026-09-08 — Test Event dialog picks real rows and watches the real delivery

Full reference: `Back/knowledge/updates/2026-09-08-analyticsTestEventInjection.update.md`
(the backend change and why) and `Back/knowledge/front-back-relations.md`
("Admin Analytics Webhooks section").
Supersedes `2026-09-02-analyticsWebhookTestEvent.update.md`.

## Problem

Running an admin test event through an n8n workflow died at the **Befroosh Wait** node with
`Snapshot refresh failed (HTTP 404): ANALYTICS_WEBHOOK_EVENT_NOTFOUND`.

The dialog let an operator type a made-up user (status, name, mobile, an optional workspace and
Instagram page). Nothing behind those values existed, and the backend persisted nothing, so
every node after the trigger — Wait, Replay, Assign Action — called back into Befroosh with ids
that resolved to no row.

## Solution

The backend now **injects** a real event instead of simulating one, so the dialog's job changed:
pick REAL rows, then watch the real delivery.

**Form** — three cascading pickers, each rendered only when the chosen event type needs it
(matching what core's snapshot adapter for that parent dereferences):

| Event type | Pickers shown |
|---|---|
| `account.*`, `auth.*`, `onboarding.*`, `telegram.*`, `subscription.*` | user |
| `workspace.*` | user → workspace |
| `automation.*` | user → workspace → automation |

- User: debounced (350ms) search box feeding `GET /users?search=`, then a select.
- Workspace: `GET /users/:id/workspaces`, marks personal workspaces.
- Automation: `GET /analytics-webhooks/test-event-automations/:workspaceId`.
- Changing the event type or the workspace clears selections that no longer apply, so a stale id
  is never submitted (a `useEffect` per dependency, plus zod `.refine()` guards on submit).

**Result panel** — delivery is asynchronous now (core's poller picks the row up within ~30s), so
the panel polls `GET /analytics-webhooks/:id/test-event/:deliveryId` every 3s and stops once the
status is terminal (`delivered` / `dead_lettered` / `cancelled`). It shows a spinner while
queued, the endpoint's real response status, `lastError` on failure, the `eventId`, an
`origin: test` badge, and a collapsible payload preview.

It also warns when the chosen event type has **no snapshot adapter** in core
(`snapshotSupported: false` — `auth.*`, `onboarding.*`, `telegram.*`, `subscription.*`), so an
operator does not blame the test for a real product gap that affects genuine events too.

## Changes

- `src/app/(main)/webhooks/test-event-dialog.tsx` — rewritten. Form schema is now
  `{ type, userId, workspaceId?, automationId? }`. Backend error codes surface via
  `t_ec = useTranslations('ERROR_CODES')` per CLAUDE.md §10, matching `label-form-dialog.tsx`'s
  convention (`toast.error(t_ec(err?.response?.data?.code) || t('toastError'))`).
  Dropped the now-unused `p2eNumber` / `formatNumber` / `useSelectOnFocus` / `statusLabels`
  imports (CLAUDE.md §18's number-input rules no longer apply — there are no number fields left).
- `src/messages/fa.json` — 18 new `Webhooks` keys including a nested `deliveryStatus` map
  (`queued`/`pending`/`in_flight`/`delivered`/`dead_lettered`/`cancelled`); 17 synthetic-form
  keys removed (verified unused elsewhere first); 5 new `ERROR_CODES` entries.
  `ANALYTICS_WEBHOOK_EVENT_NOT_SUBSCRIBED` and `WORKSPACE_NOT_OWNED_BY_USER` already existed and
  were deliberately left with their original wording. Key order preserved (no re-sort), so the
  diff is 32 insertions / 19 deletions rather than a whole-file churn.
- `webhook-drawer.tsx` — unchanged; it passes the same `open`/`onOpenChange`/`endpointId` props.

## Verification

- `npx tsc --noEmit` in `apps/admin` — **120 errors before, 120 after**. Baseline measured
  properly: the new files were saved aside, `git checkout`'d back to HEAD, tsc run, then
  restored. The one error inside the new dialog is the app-wide pre-existing `Badge children` /
  `BadgeProps` mismatch (see `project_admin_frontend_tsc`), the identical pattern the old dialog
  already produced at line 371 and that `columns.tsx` and `webhook-drawer.tsx` still produce.
- `npx eslint` on the dialog — clean (0 errors, 0 warnings). One `react-hooks/exhaustive-deps`
  warning about `users` feeding a `useMemo` was found and fixed by memoizing it.
- No test runner exists for this app (see `project_admin_frontend_tsc`).

## Not done

- **Not exercised in a browser or against a live n8n workflow.** Needs `pnpm dev` on the admin
  app plus a deployed backend on back2. The cascading pickers, the 3s delivery poll and the
  terminal-state handling are all unverified at runtime.

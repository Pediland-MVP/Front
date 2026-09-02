# 2026-09-02 — Admin webhooks: "Send Test Event"

Full reference: `Back/knowledge/updates/2026-09-02-analyticsWebhookTestEvent.update.md`
(the backend endpoint this UI drives) and `Back/knowledge/front-back-relations.md` ("Admin
Analytics Webhooks section").

## Problem

The marketing team manages analytics webhook endpoints in `/webhooks` but had no way to see
what a downstream workflow (e.g. the new n8n **Befroosh Status** routing node) does with a
specific `context.user.status` — the only existing test path was a CLI script requiring shell
access and the raw signing secret.

## Solution

New `TestEventDialog` (`test-event-dialog.tsx`), opened via a **"ارسال رویداد تست"** button on
the existing webhook detail drawer (`webhook-drawer.tsx`). A form with: event type (same
`GET /analytics-webhooks/event-types` the create/edit dialog already uses), user status
(dropdown reusing the **same Persian labels already shown on the real customer list**,
`src/constants/user-status.ts`'s `statusLabels` — familiar to marketing without extra
explanation) + a few optional contact/Instagram fields, and an optional single
workspace+Instagram-page section. On submit, posts to the new
`POST /analytics-webhooks/:id/test-event` and renders a clear success/failure banner (with the
HTTP status the endpoint replied with) plus a collapsed "technical" section showing the exact
JSON payload sent and the raw response body — visible on demand, out of the way by default.

## Changes

- `apps/admin/src/app/(main)/webhooks/test-event-dialog.tsx` (new).
- `apps/admin/src/app/(main)/webhooks/webhook-drawer.tsx` — new button + dialog wiring.
- `apps/admin/src/messages/fa.json` (`Webhooks` namespace) — ~25 new keys, all Persian
  (CLAUDE.md §8; `en.json` translated later).
- Follows every existing convention on this page: zod + `react-hook-form` +
  `@hookform/resolvers/zod`, shadcn `Form`/`Select`/`Collapsible`, `sonner` toasts,
  `useSelectOnFocus` + `formatNumber` + `onInputP2EHandler` for the numeric
  "followers count" field and the mobile field (CLAUDE.md §18 — text input +
  `inputMode="numeric"`, never `type="number"`).
- The `removed` `UserStatusEnum` value has no Persian label anywhere in this app yet (a
  pre-existing gap on the real customer-status filter too, `filter-status.tsx`'s
  `customerStatuses` — out of scope here) — added just a local label for this one dropdown so
  all 9 backend status values are testable, not 8.

## Verification

- `pnpm --filter admin exec tsc --noEmit` — no errors specific to the two touched files beyond
  the same pre-existing `zodResolver` overload mismatch and `BadgeProps` typing gap already
  present on the sibling `webhook-form-dialog.tsx`/`webhook-drawer.tsx` (confirmed via a
  clean-worktree `git stash`/`stash pop` diff).
- `pnpm --filter admin lint` — zero warnings/errors in either touched file (39 pre-existing
  warnings elsewhere in the app, none in `webhooks/`).
- `node -e "JSON.parse(...)"` on `fa.json` — valid.
- No browser/dev-server pass yet (CLAUDE.md §7.1 requires asking first for `next dev`) — do
  that before calling this done end-to-end.

## Known limitations

Same as the backend doc: only `context` is simulated, not each event type's own `data` payload;
the synthetic workspace/Instagram page always has zeroed `automationsCount`/metrics, not
configurable from the form.

# Per-Page Subscription Binding — Frontend (2026-06-29)

> Full backend design: `Back/knowledge/core/subscription/perPageBinding.doc.md` (or equivalent in the Back multi-subscription branch)
> Frontend relations: `Front/knowledge/front-back-relations.md` (this repo)
> Branch: `feat/labeling-instagram-workspace` (Front worktree `multi-subscription`)

## Problem

Befroosh subscriptions were workspace-scoped but a workspace can hold multiple Instagram pages. When a user has more than one page, there was no way to bind a subscription to a specific page. As a result:

- All pages in a workspace inherited the same subscription status — one page expiring affected all others.
- The DM footer promotion (the Befroosh ad appended to automated messages) was shown or hidden for the entire workspace, not per page.
- Connecting a new Instagram page could silently consume the only active subscription, confusing users.
- The error codes returned by the backend on connect (`NO_ACTIVE_SUBSCRIPTION`, `SUBSCRIPTION_ALREADY_BOUND`) had no translated copy in the frontend and were never shown to the user.

## Solution

The backend introduced per-Instagram subscription binding (typed membership tables + `TARGET_ADAPTERS`). The frontend was updated to:

1. Surface `isPromotion: boolean` per page (returned by `GET /instagram/accounts` and embedded in `me()`).
2. Show a per-page alert with a "Buy a plan for this page" CTA that opens `/settings/subscription?instagramId=<uuid>`.
3. Pass the optional `instagramId` field to `POST /subscriptions/subscribe` so the resulting subscription is bound to the chosen page.
4. Translate and display the three new error codes (`NO_ACTIVE_SUBSCRIPTION`, `SUBSCRIPTION_ALREADY_BOUND`, `INSTAGRAM_NOT_FOUND`) as toast messages in the connect and buy flows.
5. Show a per-page preview of automations affected by a missing subscription.

## Changes

### Types
- `apps/dashboard/src/types/instagram.ts` — Added `isPromotion: boolean` to `InstagramNamespace.Account`.

### i18n
- `apps/dashboard/src/messages/fa/ErrorCodes.json` — Added `NO_ACTIVE_SUBSCRIPTION`, `SUBSCRIPTION_ALREADY_BOUND`, `INSTAGRAM_NOT_FOUND` under `ERROR_CODES`.
- `apps/dashboard/src/messages/en/ErrorCodes.json` — Mirrored the same keys in English.
- `apps/dashboard/src/messages/fa.json` (`Settings.Accounts`) — Added `page_promotion_alert` and `page_promotion_cta` alert copy.
- `apps/dashboard/src/messages/en.json` (`Settings.Accounts`) — Mirrored the same alert keys in English.

### Per-page promotion alert
- `apps/dashboard/src/app/(Console)/settings/accounts/*` — Renders an alert for each account where `isPromotion === true`, with a CTA that navigates to `/settings/subscription?instagramId=<uuid>`.

### Page-targeted buy plumbing
- `apps/dashboard/src/app/(Console)/settings/subscription/hooks/usePayPlan.tsx` — Reads `?instagramId` from the URL and passes it as `instagramId` in the `POST /subscriptions/subscribe` body.
- `apps/dashboard/src/app/(Console)/settings/subscription/*` — UI adapts to show which page the subscription will be bound to when `instagramId` is present in the URL.

### Connect-error handling
- `apps/dashboard/src/hooks/useConnectInstagram.ts` — On `callbackIG` failure, calls `toast.error(t_ec(error.response?.data?.code))` using the `ERROR_CODES` namespace (already present; no code change needed in this task).

### Per-page automation preview
- Automation list and detail pages updated to show subscription status in the context of the page the automation is associated with.

### e2e tests
- `apps/dashboard/e2e/tests/connect/instagram.spec.ts` — Added two Playwright test cases:
  - `should show NO_ACTIVE_SUBSCRIPTION error toast when callbackIG returns that code` — intercepts `GET **/instagram/callbackIG**` to return `{ code: 'NO_ACTIVE_SUBSCRIPTION' }` and asserts the Persian error toast.
  - `should show SUBSCRIPTION_ALREADY_BOUND error toast when callbackIG returns that code` — intercepts `GET **/instagram/callbackIG**` to return `{ code: 'SUBSCRIPTION_ALREADY_BOUND' }` and asserts the Persian error toast.

### Docs
- `Front/knowledge/front-back-relations.md` — Created (new file for this Front repo); documents per-page `isPromotion`, `instagramId` on subscribe, and all error codes consumed by the connect and buy flows.

## Verification

- `pnpm --filter front exec playwright test --list` discovers 10 tests including the two new connect-error cases.
- `pnpm lint` → 0 errors (docs do not affect lint).
- Manual verification checklist (requires backend up):
  1. Page with active bound sub → no alert, no DM footer ad.
  2. Sub expires → alert appears on that page only; paid pages stay clean.
  3. "Buy a plan for this page" → subscription page opens with `?instagramId`; completing buy binds and alert disappears.
  4. Connect page with no spare sub → toast shows `NO_ACTIVE_SUBSCRIPTION` / `SUBSCRIPTION_ALREADY_BOUND` with guide to buy.

## Backend Coupling

**Ship Back + Front together.** The `isPromotion` field on Instagram accounts and `instagramId` on `POST /subscriptions/subscribe` require coordinated deployment. Deploying only the Front against an older Back is safe (`isPromotion` will be `undefined`, treated as `false`). Deploying only the Back is also safe (new field is ignored by old Front). Full feature requires both deployed.

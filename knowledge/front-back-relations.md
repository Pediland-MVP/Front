# Front–Back API Relations (Dashboard)

This document maps dashboard frontend pages/components to the backend (`core`) API endpoints they consume. For the full project-wide relation map, see `Back/knowledge/front-back-relations.md`.

---

## Instagram Accounts

| Frontend | Backend Endpoint | Notes |
|---|---|---|
| `apps/dashboard/src/hooks/useConnectInstagram.ts` | `GET /instagram/callbackIG?code=<code>` | Called after Instagram OAuth redirect. On success, SWR `me` + `plans` are mutated and the user is sent to `/`. On error, `toast.error(t_ec(error.response?.data?.code))` shows the translated error message. Error codes consumed: `NO_ACTIVE_SUBSCRIPTION`, `SUBSCRIPTION_ALREADY_BOUND`, `INSTAGRAM_NOT_FOUND`, `IGCONNECT_MALFORMED_CODE`, `INSTAGRAM_ALREADY_LINKED`. |
| `apps/dashboard/src/hooks/useConnectInstagram.ts` | `GET /instagram/connectIG` | Returns `{ data: { link } }` — the Instagram OAuth URL; the user is redirected there to begin the auth flow. |
| `apps/dashboard/src/app/(Console)/settings/accounts/*` | `GET /instagram/accounts` | Returns `InstagramNamespace.Account[]`. **As of per-page subscription binding**, each account now includes `isPromotion: boolean` — `true` when the page has no active subscription (the Befroosh DM footer promotion is appended to automated messages). The dashboard renders an alert + CTA for every account where `isPromotion === true`. |

---

## User Profile (`me()`)

| Frontend | Backend Endpoint | Notes |
|---|---|---|
| `apps/dashboard/src/hooks/swr/useMe.ts` | `GET /users/me` | Returns the authenticated user profile. **As of per-page subscription binding**, the `instagrams` array inside the response (same as `/instagram/accounts`) now carries `isPromotion: boolean` per page. |

---

## Subscriptions & Plans

| Frontend | Backend Endpoint | Notes |
|---|---|---|
| `apps/dashboard/src/app/(Console)/settings/subscription/hooks/usePayPlan.tsx` | `POST /subscriptions/subscribe` | Starts a plan payment. **As of per-page subscription binding**, accepts an optional `instagramId: string` (UUID) body field to target the subscription to a specific Instagram page. When `instagramId` is provided, the backend binds the resulting subscription to that page on activation. Error codes consumed via `t_ec`: `NO_ACTIVE_SUBSCRIPTION`, `SUBSCRIPTION_ALREADY_BOUND`, `INSTAGRAM_NOT_FOUND`, `PLAN_ALREADY_SUBSCRIBED`, `PLAN_DISCOUNT_CODE_NOT_FOUND`, `PLAN_DISCOUNT_REACHED_LIMIT`. |
| `apps/dashboard/src/store/subscriptionStore.tsx` | `GET /subscriptions?page=1&limit=5&status=active,reserved,expired` | Loads user's subscription list. **As of the multi-subscription UI fix (2026-07-04)**, the frontend now reads the `instagramId: string \| null` field on each item (already returned by the backend, previously unread) — `null` means workspace-wide CREDIT or an unbound pooled subscription; a set value means the subscription is bound to that Instagram page. `settings/subscription` renders one card per active bound subscription, and `settings/instagram` shows a positive coverage badge per page using this field. **As of 2026-07-11**, each item's `planDuration.plan` is also returned (`{ id, name, minFollowers, maxFollowers }`) — the backend list query now `leftJoinAndSelect`s `planDuration.plan` — so the subscription cards render the plan's follower tier ("محدوده فالوئر"). |
| `apps/dashboard/src/store/subscriptionStore.tsx` | `GET /plans[?discountCode=code]` | Loads available plans with optional discount code. Used only for `DiscountAlert.tsx`'s referral-discount banner (`plansData.discount`) since 2026-07-04 — `ChoosePlan.tsx` no longer reads `plans[0]` from this fetch. |
| `apps/dashboard/src/app/(Console)/settings/subscription/hooks/usePlansForPage.tsx` | `GET /plans?instagramId=<id>[&discountCode=code]` | **New 2026-07-04.** Powers the `settings/subscription` page-picker (`ChoosePlan.tsx`): returns plans filtered to the specific page's follower tier (inclusive bounds). Backend fix same day: this endpoint previously guessed an arbitrary workspace page with exclusive bounds when no `instagramId` was passed — now requires an explicit `instagramId` to filter at all. |
| `apps/dashboard/src/app/(Console)/settings/subscription/verify/*` | `GET /payments/subscription/zarinpal/verify?Authority=..&Status=..` | Zarinpal callback verification. |
| `apps/dashboard/src/app/(Console)/settings/subscription/verify/*` | `GET /payments/subscription/zibal/verify?trackId=..&success=..&status=..` | Zibal callback verification. |

---

## Error Codes Consumed by Dashboard

These `ERROR_CODES` translation keys live in `apps/dashboard/src/messages/fa/ErrorCodes.json` and `en/ErrorCodes.json`. The dashboard uses `t_ec = useTranslations('ERROR_CODES')` and calls `t_ec(code)` to render localized error toasts.

| Code | Where consumed | Trigger |
|---|---|---|
| `NO_ACTIVE_SUBSCRIPTION` | `useConnectInstagram` (connect flow), `usePayPlan` (buy flow) | The page being connected/subscribed has no active subscription slot available. |
| `SUBSCRIPTION_ALREADY_BOUND` | `useConnectInstagram` (connect flow), `usePayPlan` (buy flow) | The user's active subscription is already bound to a different page. |
| `INSTAGRAM_NOT_FOUND` | `useConnectInstagram` (connect flow), `usePayPlan` (buy flow) | The `instagramId` referenced in the request is not found or does not belong to this workspace. |
| `IGCONNECT_MALFORMED_CODE` | `useConnectInstagram` (connect flow) | The OAuth `code` parameter received from Instagram is invalid or expired. |
| `INSTAGRAM_ALREADY_LINKED` | `useConnectInstagram` (connect flow) | The Instagram page is already linked to a different Befroosh account. |

---

## Automations (Content Cycles)

| Frontend | Backend Endpoint | Notes |
|---|---|---|
| `apps/dashboard/src/app/(Console)/automations/*` | `GET /content-cycles` | Returns the user's automation list. **As of per-page subscription binding**, each automation now includes a per-page subscription context so the UI can warn when an automation's assigned page has no subscription. |

---

## Admin — Tasks / Actions (`TaskManagementPanel`)

`apps/admin/src/components/tasks/task-management-panel.tsx` is the shared task
timeline. It is used in two places: the `/tasks` drawer
(`apps/admin/src/app/(main)/tasks/task-drawer.tsx`) and the customer timeline
(`apps/admin/src/app/(main)/customers/[id]/page.tsx`).

| Frontend | Backend Endpoint | Notes |
|---|---|---|
| `apps/admin/src/components/tasks/task-management-panel.tsx` | `POST /actions/status/:id` | Marking a task **done** now opens a confirm dialog first; body is `{ status: 'done', doneNote? }` — `doneNote` (free text, optional) is only sent when the admin typed one. Un-marking a task (back to `todo`) still sends only `{ status: 'todo' }` — the backend keeps the existing `doneDate`/`doneByAdmin`/`doneNote` on reopen instead of clearing them. |
| `apps/admin/src/components/tasks/task-management-panel.tsx` | `GET /actions/user/:userId?limit=30&page=1` | Each `Action` item now carries `createdByAdmin` (who created the task, may differ from the assignee `admin`), `doneByAdmin` (who marked it done), `doneNote`, and `doneDate` (see `apps/admin/src/types/actions.ts`). The backend now orders the list `createDate DESC` (newest-created first); the frontend still re-sorts client-side by `createDate` as a safety net. The panel renders "Created by" (`createdByAdmin` falling back to `admin`) for every task, and for done tasks also renders Done date, Done by, and Done note (only when each field is present). |

---

## Deploy Coupling

The `isPromotion` field on Instagram accounts and the `instagramId` field on `POST /subscriptions/subscribe` require coordinated deployment: **Back and Front MUST ship together — deploying only the Back is NOT safe.**

- **Front-only deploy (old Back):** `isPromotion` is `undefined` in the API response, treated as `false` — no alert is shown. Safe.
- **Back-only deploy (old Front):** The backend has **dropped the `Instagram.isPromotion` column**. The currently-deployed (old) Front still reads this column, which will break. **Do NOT deploy the Back without also deploying this Front.**

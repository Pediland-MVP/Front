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
| `apps/dashboard/src/store/subscriptionStore.tsx` | `GET /subscriptions?page=1&limit=5&status=active,reserved,expired` | Loads user's subscription list. |
| `apps/dashboard/src/store/subscriptionStore.tsx` | `GET /plans[?discountCode=code]` | Loads available plans with optional discount code. |
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

## Deploy Coupling

The `isPromotion` field on Instagram accounts and the `instagramId` field on `POST /subscriptions/subscribe` require coordinated deployment: **Back and Front must ship together**. Deploying only the Front to an older Back will cause `isPromotion` to be `undefined` (treated as `false` — safe, no alert shown). Deploying only the Back is safe (the field is ignored by the old Front).

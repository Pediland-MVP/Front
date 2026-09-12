# Front–Back API Relations (Dashboard)

This document maps dashboard frontend pages/components to the backend (`core`) API endpoints they consume. For the full project-wide relation map, see `Back/knowledge/front-back-relations.md`.

---

## Instagram Accounts

| Frontend | Backend Endpoint | Notes |
|---|---|---|
| `apps/dashboard/src/hooks/useConnectInstagram.ts` | `GET /instagram/callbackIG?code=<code>` | Called after Instagram OAuth redirect. On success, SWR `me` + `plans` are mutated and the user is sent to `/`. On error, `toast.error(t_ec(error.response?.data?.code))` shows the translated error message. Error codes consumed: `NO_ACTIVE_SUBSCRIPTION`, `SUBSCRIPTION_ALREADY_BOUND`, `INSTAGRAM_NOT_FOUND`, `IGCONNECT_MALFORMED_CODE`, `INSTAGRAM_ALREADY_LINKED`. |
| `apps/dashboard/src/hooks/useConnectInstagram.ts` | `GET /instagram/connectIG` | Returns `{ data: { link } }` — the Instagram OAuth URL; the user is redirected there to begin the auth flow. |
| `apps/dashboard/src/app/(Console)/settings/accounts/*` | `GET /instagram/accounts` | Returns `InstagramNamespace.Account[]`. **As of per-page subscription binding**, each account now includes `isPromotion: boolean` — `true` when the page has no active subscription (the Befroosh DM footer promotion is appended to automated messages). The dashboard renders an alert + CTA for every account where `isPromotion === true`. |
| `apps/dashboard/src/components/Connect/SetupInstagramDialog.tsx` (via `useInstagramFollowersLookup`) | `GET /instagram/lookup-followers?username=` | Now also returns `profilePicUrl?: string` and `fullName?: string` (both optional — Apify already fetched them, they just weren't surfaced before), used for a small profile card on the dialog's plan-review step. |
| `apps/dashboard/src/components/Commerce/Shop/ShopAddressSettings.tsx` (rendered on `/products/settings`, `/products/shop` now redirects there) | `GET`/`PUT /commerce/shop-address` | **New 2026-09-09, rewritten same day from per-Instagram-account to per-workspace; moved onto the shared settings page 2026-09-10** (was its own `/products/shop` page). One `CommerceShopAddress` row per WORKSPACE (province/city/address/postal code/phone/shipping method) — the seller's own return address printed on shipping labels/invoices via `IShopAddress` (`types/shopAddress.ts`). Now a section on the "تنظیمات فروشگاه" page under "کالا و خدمات", alongside `StoreSettings` — two independent forms/permission gates sharing one page, not a merged form; not a per-account dialog either — `InstagramAccounts.tsx`'s old 4th action button was removed. Gated by `usePermissions().can('order:manage')` (was `instagram:manage`), matching the Back permission split. `PUT` errors `SHOP_ADDRESS_INVALID_CITY` on a bad `cityId` (translated in `messages/fa/ErrorCodes.json`). Back doc: `Back/knowledge/core/commerce/shopAddress.doc.md`. |

---

## User Profile (`me()`)

| Frontend | Backend Endpoint | Notes |
|---|---|---|
| `apps/dashboard/src/hooks/swr/useMe.ts` | `GET /users/me` | Returns the authenticated user profile. **As of per-page subscription binding**, the `instagrams` array inside the response (same as `/instagram/accounts`) now carries `isPromotion: boolean` per page. **As of 2026-08-13** it also carries `howFoundUs: string \| null` — `me()` spreads the whole user row, so the column shipped with no backend change. |
| `apps/dashboard/src/components/Console/BusinessInfoDialog.tsx` | `POST /users` | Body gained an optional `howFoundUs` (enum `google` \| `telegram` \| `instagram` \| `friend` \| `event` \| `sms` \| `other`). This dialog is the **only** writer — the field is deliberately absent from `/settings/profile`, so `ProfileForm` never sends it. Adding an unknown value is a 400. |

> [!IMPORTANT]
> `GET /users/me` is keyed **twice** in SWR: `useUser` uses `'/users/me'`, `ProfileForm`
> uses `` `${API_URL}/users/me` ``. Anything that mutates the user must revalidate both, or
> one half of the app keeps reading stale data.

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

Automations are now workspace-owned and can target **multiple** Instagram accounts at once
(`instagramIds[]`), reconciled server-side via a join table (`instagramLinks`).

| Frontend | Backend Endpoint | Notes |
|---|---|---|
| `AutomationsCardList.tsx` (`apps/dashboard/src/app/(Console)/automations`) | `GET /contentCycle?page=&limit=&isDirect=&isComment=&haveInstagramPost=&instagramIds=` | List, filtered by zero-or-more `instagramIds` (repeated query param). Each item includes a per-page subscription context so the UI can warn when an automation's assigned page has no subscription. |
| create — `AutomationForm.tsx` | `POST /contentCycle` (body `instagramIds: string[]`) | Creates an automation owned by the workspace, linked to the given Instagram accounts. |
| edit — `AutomationForm.tsx` | `PATCH /contentCycle/:contentCycleId` (body `instagramIds: string[]`) | Reconciles `instagramLinks` (adds/removes) to match the submitted set. |
| edit prefill — `AutomationForm.tsx` | `GET /contentCycle/:contentCycleId` | Returns the automation including `instagramLinks[].instagramId`, used to preselect the multi-select field. |
| delete — `AutomationsCardList.tsx` | `DELETE /contentCycle/:contentCycleId` | Deletes one automation; other automations on shared Instagram accounts are unaffected. |
| defaults — `apps/dashboard/src/hooks/useAutomationDefaults.ts` | `GET /contentCycle/automation-defaults` | Returns this workspace's remembered automation default texts (`followMessage`, `followCheckMessage`, `commentStartText`, `commentStartTitle`, `commentTexts`), each `null` if never saved — workspace-scoped, no `instagramId` param. Used by `AutomationForm.tsx`, `JustFollowers.tsx`, `CommentReplies.tsx` to prefill new automations, falling back to the original i18n/hardcoded defaults when null. |
| post picker — `InstagramPostSelectDialog.tsx` (`components/Automations/Form`) | `GET /posts/pure?instagramId=` | Single-Instagram scoped: uses the *first* entry of the selected `instagramIds`. Post-scoped automations (`haveInstagramPost`) are constrained to exactly one Instagram account (`POST_SCOPED_AUTOMATION_REQUIRES_SINGLE_INSTAGRAM`). |

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

## Admin — Users list, detail & excel export

| Frontend | Backend Endpoint | Notes |
|---|---|---|
| `apps/admin/src/app/(main)/users/client-page.tsx` | `GET /users?howFoundUs=a,b` | **Added 2026-08-13.** Optional comma-separated acquisition-channel filter, built from `FilterHowFoundUs` in `customer-table.tsx`. Values are the `HOW_FOUND_US` enum; an unknown item is a **400**, not a silent drop. Composes with the existing `categoryIds` / `adminIds` filters — a KAM stays scoped to their own users. |
| `apps/admin/src/app/(main)/users/customer-table.tsx` | `POST /users/excelExport` | Body gained an optional `howFoundUs: string[]` (a real JSON array here, not a comma string — it is a POST body). Only sent when the table filter is non-empty. The generated sheet has a `چطور با ما آشنا شد` column, `ندارد` when null. |
| `apps/admin/src/app/(main)/users/[id]/page.tsx` | `GET /users/:id` | Response gained `howFoundUs: string \| null`, rendered read-only in the profile sidebar. No backend filter change was needed — `readUser` runs the same pro stats query, so it picked up the new select column for free. |

---

## Shop checkout — RETIRED (2026-09-12) · Vitrin

> [!CAUTION]
> **`apps/dashboard/src/app/(Shop)/` and `apps/dashboard/src/components/Shop/` are deleted.** The
> public buyer checkout at `/:instagramUsername/:productId/order` is gone and every Back route it
> called now 404s. Buying happens inside the Instagram DM (buy-in-direct). Also removed:
> `apps/dashboard/src/types/shops/` (orphaned) and the `Checkout` i18n namespace from `fa.json` /
> `en.json` (47 keys, unused).
>
> Back routes removed with it: `GET /shops/:shopId`, `GET /products/:id`,
> `GET /auth/leadInstagram/:shopId/:productId`, `GET /leads/my/contact`, and twelve
> `AuthGuard('lead')` routes on `orders`. See
> `Back/knowledge/updates/2026-09-12-retireLegacyShopCheckout.update.md`.

**`proxy.ts` keeps two shop-shaped allowances on purpose.** The `/:shop/:product/order`
pass-through and the `payments/verify` matcher exclusion both survive so a stale link renders the
app's **404** page. Delete either one and the request falls into `consoleMiddleware`, which sees no
`token` cookie and redirects the buyer to `/auth` — showing a login screen to someone who tapped a
product card is a worse answer than "this page is gone". Those buttons live in already-sent
Instagram messages and stay tappable forever (`MVP/CLAUDE.md` §11.5), so this is permanent.

**The automation form no longer offers `PRODUCT`.** Removed from `contentTypeOptions`
(`packages/ui/src/automation-builder/Contents/ContentTypeOptions.tsx`) in both builder modes —
unlike `INSTAGRAM_POST` / `BUY_IN_DIRECT`, which are only template-gated. Back refuses the type on
create **and** update, so an un-ported `product` automation cannot be saved until migration Phase 13
converts it. `AutomationContentTypesEnum.PRODUCT` stays in the enum: existing contents must keep
rendering.

| Frontend | Backend Endpoint | Notes |
|---|---|---|
| `apps/dashboard/src/app/(Console)/products/[id]/product.tsx` | `GET/POST/PUT /vitrin[/:id]` | Vitrin is **untouched** by the shop retirement — its cards carry merchant-defined template buttons, never the deleted order URL. These routes were accidentally removed on Back `workspace-refactor` (empty controller) and restored on `fix/shop-workspace-scoping`, gated by `PRODUCT_CREATE` / `PRODUCT_EDIT` / `PRODUCT_DELETE`. (`components/Products/ProductForm.tsx` was deleted earlier, with the legacy products UI.) |
| `apps/dashboard/src/app/(Console)/orders/page.tsx` | `GET /orders`, `POST /orders/:id/updateStatus`, `POST /orders/excelExport` | The legacy **merchant** orders screen — still live, which is exactly why those three routes were kept. Workspace-scoped, so teammates see the same orders. Error code `EXCEL_EXPORT_WORKSPACE_REQUIRED`. Retire together with the Back routes once `/products/orders` fully replaces it (see `before-prod-cutover.md`). |

---
## Commerce — Shipping Methods

The «تنظیمات ارسال پستی» screen (`/products/shipping`) is the only consumer of these routes. Every
one requires `ORDER_VIEW` to read and `ORDER_MANAGE` to write, matching `ShippingOptionsController`.

| Route | Used by | Notes |
| --- | --- | --- |
| `GET /commerce/shipping-options` | `hooks/useShippingOptions.ts` | `PaginatedResult` envelope, one synthetic page, no page/limit. **Each option arrives with its `overrides` eager-loaded** — this is the only way the frontend can read exceptions; there is no `GET :id/overrides`. |
| `POST /commerce/shipping-options` | same | Response is `ResponseMessage`; the screen reads `data.data.id` to attach the new option's exceptions. |
| `PATCH /commerce/shipping-options/:id` | same | Partial update — only the keys sent are touched. |
| `DELETE /commerce/shipping-options/:id` | same | Cascades to the option's overrides. **Refused for a seeded method** (`isSystem`) with `COMMERCE_SHIPPING_OPTION_NOT_DELETABLE`; `ShippingMethodCard` hides the delete button on those, so the code is a safety net rather than a path a merchant can reach through the UI. |
| `PUT /commerce/shipping-options/:id/overrides` | same | **Full replace**, capped at 200 rows. Rejected outright on any non-`prepaid` settlement, so the screen sends an empty list when the carrier collects. |
| `GET /cities`, `GET /cities/provinces` | `hooks/useShippingDestinations.ts` | Fetched whole and cached with `useSWRImmutable`. A saved exception stores a bare `cityId`, so the full table is what turns ids back into names. `GET /cities` returns `provinceId` on every row — `types/city.ts` was missing that field. |

**Settlement enum ↔ UI.** The API's `settlement` is three-way and mutually exclusive (`prepaid` /
`freight_collect` / `cash_on_delivery`), enforced by `CHK_commerce_shipping_option_rate`. The
screen renders it as a radio group, one control per value, so a new mode added on the Back appears
as an unlabelled option until `Commerce.Shipping.settlements`/`settlementNotes` gain a key for it.
Only `prepaid` carries a rate; the other two send `amount: 0`, `freeOverAmount: null` and an empty
override list.

**Cash-on-delivery.** `GET`/`POST /payments/cardToCard` carry `codMaxOrderValue` only — a
shop-wide ceiling, consumed by `app/(Console)/settings/card/page.tsx`. Omitting it leaves it
untouched; `null` clears it. Whether COD is offered is NOT here: it is the shipping method's
`settlement`, which is also why the old "a COD-only merchant needs bank details" gap no longer
exists.

**Error codes.** `COMMERCE_SHIPPING_OPTION_NOT_FOUND`, `COMMERCE_SHIPPING_OPTION_UNAVAILABLE`,
`COMMERCE_SHIPPING_THRESHOLD_REQUIRED`, `COMMERCE_SHIPPING_OVERRIDE_NOT_ALLOWED`,
`COMMERCE_SHIPPING_OVERRIDE_TARGET` — all translated in `messages/fa/ErrorCodes.json`.

## Commerce — Orders

The `/products/orders` (list) and `/products/orders/[id]` (detail) merchant screens, redesigned
2026-09-04 — see `knowledge/updates/2026-09-04-ordersScreenRedesign.update.md`.

| Route | Used by | Notes |
| --- | --- | --- |
| `GET /commerce/orders` | `apps/dashboard/src/hooks/useCommerceOrders.ts`, consumed by `components/Commerce/Orders/OrdersTable.tsx` and `OrderRowCard.tsx` | **As of 2026-09-04**, returns `OrderListView` (`OrderView` + `receiptUrl: string \| null`, `receiptCount: number`) instead of plain `OrderView`. `receiptUrl` is the newest کارت‌به‌کارت receipt (`null` if none was ever sent, or its file row is gone); `receiptCount` is how many receipts exist, so the row can mark a re-upload without shipping every url. Rendered via `OrderThumbs.tsx` alongside the first line's product image, opening `ReceiptLightbox` in place. Back doc: `Back/knowledge/updates/2026-09-04-orderListViewReceipts.update.md`. |
| `GET /commerce/orders/:id` | `apps/dashboard/src/hooks/useCommerceOrder.ts`, consumed by `OrderDetail.tsx`/`OrderSummaryRail.tsx` | `OrderDetailView` (`OrderView` + `receipts: OrderReceiptView[]`, full trail newest-first). **As of 2026-09-09**, also carries `shop: OrderShopView \| null` (detail only, not the list route) — consumed by `OrderDetail.tsx`'s print-label/print-invoice buttons as the document's sender block. Two independent sources, resolved server-side (unchanged shape after the same-day rearchitecture): the identity fields (`instagramName`/`instagramUsername`/`profilePictureUrl`) from `customer.instagramId` → `Instagram`; the address fields from the order's own `workspaceId` → `CommerceShopAddress` (one row per workspace). `shop` is `null` only when neither resolves. Back doc: `Back/knowledge/core/commerce/orderPrintPayload.doc.md`. |
| `POST /commerce/orders/:id/approve` \| `/reject` \| `/ship` \| `/complete` \| `/cancel` \| `/revert` \| `/mark-paid` | `OrderStatusUpdater.tsx` | Driven by a single status `<Select>` (`orderTransitions.ts`'s `targetStatusesFor`/`actionForTransition`) + a transition-specific confirmation dialog, replacing six standalone buttons. `approve` and `mark-paid` require confirmation (previously one-click). **As of 2026-09-07 the select offers EVERY other status from every status** — the only omission is `sending` on a digital order — and `POST :id/revert` is new (`→ awaiting_review`, the first backward move; restocks server-side when the order was holding stock). `ACTIONS_BY_STATUS` in `orderTransitions.ts` must stay a faithful mirror of Back's `ORDER_TRANSITIONS`; both files carry cross-reference comments, and `orderTransitions.test.ts` guards this side. `hasAnyAction` is now true for every order, so `OrderDetailPage` renders the status slot unless the viewer lacks `order:manage`. New error code needing a `fa.json` key: `COMMERCE_INSUFFICIENT_STOCK_FOR_STATUS` (added). Back doc: `Back/knowledge/updates/2026-09-07-orderFreeStatusChoice.update.md`. |

Every `/commerce/orders*` route has a frontend consumer as of this redesign — the table above is
complete, not partial.

## Deploy Coupling

The `isPromotion` field on Instagram accounts and the `instagramId` field on `POST /subscriptions/subscribe` require coordinated deployment: **Back and Front MUST ship together — deploying only the Back is NOT safe.**

- **Front-only deploy (old Back):** `isPromotion` is `undefined` in the API response, treated as `false` — no alert is shown. Safe.
- **Back-only deploy (old Front):** The backend has **dropped the `Instagram.isPromotion` column**. The currently-deployed (old) Front still reads this column, which will break. **Do NOT deploy the Back without also deploying this Front.**

The `GET /shops/:shopId` payment-detail move (`shop.user` → `shop.workspace`, 2026-08-15) is coupled the same way: **Back and Front MUST ship together.**

- **Front-only deploy (old Back):** the old Back still returns `user`, so `shop.workspace` is `undefined` and the checkout shows no payment methods.
- **Back-only deploy (old Front):** the old Front reads `shop.user`, which the new Back no longer returns — same result.

---

## Ice Breakers — پیام خوش‌آمدگویی (2026-08-28)

New dashboard page `/automations/welcome` (`WelcomeMessageManager.tsx`,
`useIceBreakers.ts`) calling three endpoints that exist **only on the new Back**:

- `GET /ice-breakers?instagramId=…`
- `POST /ice-breakers`

The automation picker does **not** use a bespoke endpoint — it reuses the shared
`GET /contentCycle/conditions?instagramIds=…` through `AutomationSearchSelect`,
the same component the START_AUTOMATION button picker uses.

Full request/response contract: `Back/knowledge/front-back-relations.md` →
"Ice Breakers".

**Deploy coupling — Front must not ship before Back.**

- **Front-only deploy (old Back):** the three routes 404, so the new sidebar entry
  leads to a page that can never load. The rest of the dashboard is unaffected —
  the failure is contained to this page.
- **Back-only deploy (old Front):** safe. The endpoints simply go unused, and no
  existing Front code reads the new `Instagram.iceBreakerSyncedAt` /
  `iceBreakerSyncError` columns.

So this pair is **Back-first**, unlike the `isPromotion` and `shop.workspace`
changes above which must ship simultaneously.

**Save IS publish.** `POST /ice-breakers` writes the rows and pushes to Instagram
in the same request, so a 200 means the questions are live and a 400 means they
are not (`INSTAGRAM_TOKEN_EXPIRED` for Meta OAuthException 190, else
`ICE_BREAKER_SYNC_FAILED`). `syncedAt` / `syncError` on the GET cover only the
failures the user did not cause directly — a non-fatal re-push after an
automation is deleted or the account is reconnected.
### Commerce shipping (2026-08-27)

The shipping screen and the Back shipping feature are **deploy-coupled in one direction**: the
Front calls routes that exist only on `feat/commerce-shipping-methods` (merged into
`feat/commerce-product-core`).

- **Back-only deploy (old Front):** safe. Nothing on the old Front calls these routes.
- **Front-only deploy (old Back):** every request 404s and the screen is dead. **Ship the Back
  first, or ship both together.**

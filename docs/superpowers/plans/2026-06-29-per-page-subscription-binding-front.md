# Per-Page Subscription Binding — FRONTEND Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the promotion alert **per Instagram page** (only pages with no active bound subscription), let users start a **page-targeted** purchase, and surface the new connect error codes.

**Architecture:** The dashboard reads per-page `isPromotion` (now derived on the backend) from `GET /instagram/accounts` and from `me()`. A per-page alert with a "buy a plan for this page" CTA routes to the subscription page with `?instagramId=<id>`; the buy flow forwards that id to `POST /subscriptions/subscribe`. Connect errors (`NO_ACTIVE_SUBSCRIPTION`, `SUBSCRIPTION_ALREADY_BOUND`) are translated via the existing `t_ec` path.

**Tech Stack:** Next.js (app router), `next-intl`, SWR, axios, Tailwind, `@befroosh/ui`, Playwright e2e. Dashboard package name: **`front`** (`apps/dashboard`).

**Depends on BACKEND plan** (`Back/.../2026-06-29-per-page-subscription-binding-back.md`): `GET /instagram/accounts` and `me()` return per-page `isPromotion`; `POST /subscriptions/subscribe` accepts optional `instagramId`; new error codes `NO_ACTIVE_SUBSCRIPTION`, `SUBSCRIPTION_ALREADY_BOUND`, `INSTAGRAM_NOT_FOUND`.

**Spec:** `Back/.../specs/2026-06-29-per-page-subscription-binding-design.md` (cross-repo, same machine).

## Global Constraints

- **i18n (CLAUDE.md §7):** never hardcode user-facing text. Add keys to **`fa.json`** (and the `fa/ErrorCodes.json` split file); `en` is filled later but add English too where the file already has English. Error codes go under `ERROR_CODES`.
- **Error codes (CLAUDE.md §9):** the backend `code` drives the message via `const t_ec = useTranslations("ERROR_CODES"); toast.error(t_ec(code))`.
- **Number inputs (CLAUDE.md §18):** not relevant here (no new numeric inputs), but if any appear, use the `p2eNumber` text-input pattern.
- **Verify each task:** `pnpm --filter front lint` and `pnpm --filter front build` (Next.js typechecks on build). e2e: `pnpm --filter front test:e2e -- <spec>` (Playwright).
- **Docs:** update `Front/knowledge/front-back-relations.md` and add `Front/knowledge/updates/2026-06-29-perPageSubscriptionBinding.update.md`.

---

## File Structure

**Create:**
- `apps/dashboard/src/components/Settings/PagePromotionAlert.tsx` — per-page alert + CTA.

**Modify:**
- `apps/dashboard/src/types/instagram.ts` — add `isPromotion` to `Account`.
- `apps/dashboard/src/messages/fa/ErrorCodes.json` + `en/ErrorCodes.json` — new codes.
- `apps/dashboard/src/messages/fa.json` + `en.json` — alert text + CTA label.
- `apps/dashboard/src/components/Settings/InstagramAccounts.tsx` — render the alert per card.
- `apps/dashboard/src/app/(Console)/settings/subscription/hooks/usePayPlan.tsx` — forward `instagramId`.
- `apps/dashboard/src/app/(Console)/settings/subscription/page.tsx` (or `ChoosePlan.tsx`) — read `?instagramId` and pass down.
- `apps/dashboard/src/components/Automations/Form/Contents/Contents.tsx` — per-page promotion (not `instagrams[0]`).
- `apps/dashboard/e2e/tests/connect/instagram.spec.ts` — connect-error cases.

---

## Task 1: Types — per-page promotion + targeted buy

**Files:**
- Modify: `apps/dashboard/src/types/instagram.ts`

**Interfaces:**
- Produces: `Account.isPromotion: boolean`.

- [ ] **Step 1: Add `isPromotion` to the `Account` type**

In `types/instagram.ts`, in `interface Account { ... }` add:
```ts
isPromotion: boolean;
```

- [ ] **Step 2: Build to typecheck**

Run: `cd /home/cvexor/Documents/MVP/Front/worktrees/multi-subscription && pnpm --filter front build`
Expected: PASS (or surfaces places that must handle the new field — fixed in later tasks).

- [ ] **Step 3: Commit**
```bash
git add apps/dashboard/src/types/instagram.ts
git commit -m "feat(types): per-page isPromotion on Account"
```

---

## Task 2: i18n — error codes + alert copy

**Files:**
- Modify: `apps/dashboard/src/messages/fa/ErrorCodes.json`, `apps/dashboard/src/messages/en/ErrorCodes.json`
- Modify: `apps/dashboard/src/messages/fa.json`, `apps/dashboard/src/messages/en.json`

- [ ] **Step 1: Add error-code translations**

In `fa/ErrorCodes.json`, inside the `ERROR_CODES` object add (Persian copy):
```json
"NO_ACTIVE_SUBSCRIPTION": "برای این پیج اشتراک فعالی وجود ندارد. لطفاً یک پلن بخرید.",
"SUBSCRIPTION_ALREADY_BOUND": "اشتراک فعال شما برای پیج دیگری استفاده شده است. برای این پیج یک پلن جدید بخرید.",
"INSTAGRAM_NOT_FOUND": "پیج اینستاگرام پیدا نشد."
```
Mirror in `en/ErrorCodes.json`:
```json
"NO_ACTIVE_SUBSCRIPTION": "No active subscription for this page. Please buy a plan.",
"SUBSCRIPTION_ALREADY_BOUND": "Your active subscription is used by another page. Buy a new plan for this page.",
"INSTAGRAM_NOT_FOUND": "Instagram page not found."
```

- [ ] **Step 2: Add the page-alert copy**

In `fa.json`, under a `Settings` (or the existing instagram-accounts) namespace used by `InstagramAccounts.tsx`, add:
```json
"page_promotion_alert": "این پیج اشتراک فعال ندارد؛ تبلیغ بفروش در پایان پیام‌های خودکار نمایش داده می‌شود.",
"page_promotion_cta": "خرید پلن برای این پیج"
```
Mirror English keys in `en.json` (same key names, English values). Use the exact namespace `InstagramAccounts.tsx` reads (confirm its `useTranslations("...")` call and place the keys there).

- [ ] **Step 3: Validate JSON**

Run: `cd /home/cvexor/Documents/MVP/Front/worktrees/multi-subscription && node -e "['fa/ErrorCodes','en/ErrorCodes','fa','en'].forEach(f=>require('./apps/dashboard/src/messages/'+f+'.json'))" && echo OK`
Expected: `OK` (valid JSON).

- [ ] **Step 4: Commit**
```bash
git add apps/dashboard/src/messages
git commit -m "i18n: per-page promotion alert + new subscription error codes"
```

---

## Task 3: Page-targeted buy plumbing

**Files:**
- Modify: `apps/dashboard/src/app/(Console)/settings/subscription/hooks/usePayPlan.tsx`
- Modify: `apps/dashboard/src/app/(Console)/settings/subscription/page.tsx` (and/or `ChoosePlan.tsx`)

**Interfaces:**
- Produces: the subscribe request includes `instagramId` when present.

- [ ] **Step 1: Forward `instagramId` from the hook**

In `usePayPlan.tsx`, accept an optional `instagramId` (from a hook arg or read from `useSearchParams()` — match how the hook currently gets inputs). In the `POST /subscriptions/subscribe` body, include it when set:
```ts
const body = {
  planId,
  durationId,
  ...(discountCode ? { discountCode } : {}),
  ...(instagramId ? { instagramId } : {}),
};
```
Keep the existing `.catch` that does `toast.error(t_ec(e.response?.data.code))` — it already covers the new codes from Task 2.

- [ ] **Step 2: Read `?instagramId` on the subscription page**

In `settings/subscription/page.tsx` (a client component or pass via the client child), read `const instagramId = useSearchParams().get("instagramId") ?? undefined;` and pass it into the buy flow (`ChoosePlan` → `usePayPlan`). When absent, the buy stays untargeted (onboarding/pool) — no behavior change for existing users.

- [ ] **Step 3: Build**

Run: `pnpm --filter front build`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add apps/dashboard/src/app/\(Console\)/settings/subscription
git commit -m "feat(subscription): forward instagramId for page-targeted buy"
```

---

## Task 4: Per-page promotion alert in the page list

**Files:**
- Create: `apps/dashboard/src/components/Settings/PagePromotionAlert.tsx`
- Modify: `apps/dashboard/src/components/Settings/InstagramAccounts.tsx`

**Interfaces:**
- Consumes: `Account.isPromotion`; routes to `/settings/subscription?instagramId=<id>`.

- [ ] **Step 1: Create the alert component**
```tsx
// PagePromotionAlert.tsx
"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@befroosh/ui/components/button"; // match the project's button import path

export function PagePromotionAlert({ instagramId }: { instagramId: string }) {
  const t = useTranslations("InstagramAccounts"); // use the same namespace as Task 2 keys
  const router = useRouter();
  return (
    <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
      <p>{t("page_promotion_alert")}</p>
      <Button
        size="sm"
        variant="outline"
        className="mt-2"
        onClick={() => router.push(`/settings/subscription?instagramId=${instagramId}`)}
      >
        {t("page_promotion_cta")}
      </Button>
    </div>
  );
}
```
(Confirm the exact `Button` import + props against an existing component in `InstagramAccounts.tsx`; reuse whatever it already imports.)

- [ ] **Step 2: Render it per card**

In `InstagramAccounts.tsx`, inside the `instagramPages?.data?.map((instagram) => ( ... ))` card, after `CardContent`, add:
```tsx
{instagram.isPromotion && <PagePromotionAlert instagramId={instagram.id} />}
```
Add the import at the top:
```tsx
import { PagePromotionAlert } from "./PagePromotionAlert";
```

- [ ] **Step 3: Build + lint**

Run: `pnpm --filter front build && pnpm --filter front lint`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add apps/dashboard/src/components/Settings/PagePromotionAlert.tsx apps/dashboard/src/components/Settings/InstagramAccounts.tsx
git commit -m "feat(settings): per-page promotion alert with buy CTA"
```

---

## Task 5: Automation promotion preview becomes per-page

**Files:**
- Modify: `apps/dashboard/src/components/Automations/Form/Contents/Contents.tsx`

**Interfaces:**
- Consumes: the per-page `isPromotion` from `me().instagrams` for the automation's specific page.

- [ ] **Step 1: Use the page the automation belongs to**

`Contents.tsx:57` currently reads `const isPromotion = user?.instagrams?.[0]?.isPromotion;`. An automation always belongs to one Instagram page, so locate that page id first. Trace where `Contents.tsx` gets its automation/page context: check the parent automation form (props, route param like `useParams()`, or the form state/store) for the selected `instagramId` — the same id used when creating/saving the automation. Bind a local `currentInstagramId` to it, then:
```ts
const isPromotion =
  user?.instagrams?.find((i) => i.id === currentInstagramId)?.isPromotion ?? false;
```
The backend now returns correct per-page `isPromotion` on each `me().instagrams[i]`, so matching by id is sufficient.

- [ ] **Step 1a: Confirm the page id source**

Run (from repo root): `grep -rn "instagramId\|useParams\|instagram\b" apps/dashboard/src/components/Automations/Form | grep -iv test | head`
Use the result to pick the exact `currentInstagramId` source before editing.

- [ ] **Step 2: Build**

Run: `pnpm --filter front build`
Expected: PASS.

- [ ] **Step 3: Commit**
```bash
git add apps/dashboard/src/components/Automations/Form/Contents/Contents.tsx
git commit -m "feat(automations): per-page promotion preview"
```

---

## Task 6: Connect-error handling (e2e)

**Files:**
- Modify: `apps/dashboard/e2e/tests/connect/instagram.spec.ts`
- (No code change needed in `useConnectInstagram.ts` — it already shows `t_ec(error.response?.data?.code)`; Task 2 supplies the strings.)

- [ ] **Step 1: Add Playwright cases**

Extend the connect spec to assert that when the callback returns `NO_ACTIVE_SUBSCRIPTION` or `SUBSCRIPTION_ALREADY_BOUND`, the translated toast shows and the user is pointed to buy. Mock the `GET /instagram/callbackIG` response via Playwright route interception (follow the existing patterns in this spec file).

- [ ] **Step 2: Run**

Run: `pnpm --filter front test:e2e -- connect/instagram.spec.ts`
Expected: PASS. (If the e2e env needs the backend up, follow the existing spec's setup; otherwise stub the route.)

- [ ] **Step 3: Commit**
```bash
git add apps/dashboard/e2e/tests/connect/instagram.spec.ts
git commit -m "test(connect): per-page subscription error toasts"
```

---

## Task 7: Docs

**Files:**
- Modify: `Front/knowledge/front-back-relations.md`
- Create: `Front/knowledge/updates/2026-06-29-perPageSubscriptionBinding.update.md`

- [ ] **Step 1: Update front-back-relations** — record: `GET /instagram/accounts` and `me()` now return per-page `isPromotion`; `POST /subscriptions/subscribe` accepts optional `instagramId`; new error codes consumed by connect + buy.

- [ ] **Step 2: Write the update doc** — Problem / Solution / Changes / Verification (match existing `Front/knowledge/updates/` files; create the folder if missing).

- [ ] **Step 3: Commit**
```bash
git add Front/knowledge
git commit -m "docs(front): per-page subscription binding UI"
```

---

## Manual verification checklist (run after all tasks, with backend up)

Use the `/run` or `/verify` skill (or Playwright) to confirm end-to-end:
1. Page with an active bound sub → **no** alert, no DM footer ad.
2. Let its sub expire → alert appears on that page only; other paid pages stay clean.
3. Click "buy a plan for this page" → subscription page opens with `?instagramId`; completing the buy binds and the alert disappears for that page.
4. Connect a new page with no spare active sub → toast shows the `SUBSCRIPTION_ALREADY_BOUND` / `NO_ACTIVE_SUBSCRIPTION` message and guides to buy.

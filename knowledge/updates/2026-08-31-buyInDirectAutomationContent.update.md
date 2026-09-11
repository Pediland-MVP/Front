# 2026-08-31 — Buy-in-Direct automation content (Task 12)

Full detail: `Back/.superpowers/sdd/2026-08-31-buyInDirect-phase1/task-12-report.md`.

## Problem

The Instagram-DM "Buy in Direct" shopping flow (Tasks 1-11, Back) needed a dashboard
authoring surface: a merchant picks which commerce products an automation content step
shows, in order, before the automation can be saved.

## Solution

Added `AutomationContentTypesEnum.BUY_IN_DIRECT = 'buy_in_direct'` and a new
`BuyInDirectContent` editor in `packages/ui/src/automation-builder/Contents/`, following
the same `{ mode, index, apiClient }` + `useFieldArray` convention every other
content-type editor in that folder uses (`ProductContentComp` is the closest sibling) —
not a controlled `value`/`onChange` leaf, since that isn't how this codebase's
content-type editors are wired into the shared `react-hook-form` instance.

- Picker: `GET /commerce/products` via the existing `apiClient.get` contract, cards use
  `coverMediaUrl`.
- Picked list: dnd-kit reorder (same idiom as `ProductContentComp`/the commerce media
  pool's `5e7bfe96`/`a2ea355e`), remove button, empty-state hint.
- Card-to-card warning: reuses `Commerce.List.NoCardToCard` copy/tokens from
  `ProductListPage.tsx` (`00b3f887`/`b78f6ab4`), not new wording.
- Validation ("at least one product"): added to `AutomationFormSchema`'s `superRefine`
  in `packages/ui/src/automation-builder/schemas/automationForm.ts`, mirroring the
  legacy PRODUCT branch — this is the actual gate (not `AutomationForm.tsx`). At the time
  this task shipped it was the ONLY gate (the backend had no equivalent check yet). **Now
  superseded — see the Task 13 addendum below**: the Back side added a matching
  non-emptiness + cross-workspace-ownership check in a later review pass, so this
  client-side `superRefine` is now a UX nicety on top of a real server-side gate, not the
  only thing standing between a merchant and an empty/foreign pick list.
- `remapTemplateContents.ts` now also strips `buyInDirectProducts` when inserting a
  template's contents into another automation — same workspace-scoped-product-ref class
  of bug the existing `products`/`productIds`/`contentProducts` strip exists for.

## Changes

See the task-12 report for the full file list, reasoning, and deviations from the
original brief (enum/test-runner/component-API corrections, verified against the real
codebase).

## Verification

`packages/ui/src/automation-builder`: 117 -> 126 tests pass (9 new, 0 regressions).
`apps/dashboard/src/components/Automations`: 26/26 pass, unchanged.
`apps/dashboard` `tsc --noEmit`: 204 pre-existing errors, unchanged (none touch new/edited
files).

## Addendum (2026-09-01, Task 13 — documentation + error-code translations)

The Back side closed the "Concerns" gap this doc originally flagged (backend did not
validate `buyInDirectProducts` non-empty or ownership): `ContentCycleContentService`
gained `assertBuyInDirectPicksValid`, throwing two new error codes —
`CONTENT_BUY_IN_DIRECT_PRODUCT_NOT_FOUND` (404, a picked product isn't owned by the
caller's workspace or is archived/soft-deleted) and
`CONTENT_SHOULD_HAVE_AT_LEAST_ONE_BUY_IN_DIRECT_PRODUCT` (400, empty/absent pick list).
Both added to `apps/dashboard/src/messages/fa/ErrorCodes.json` (the file that wins the
shallow merge — see `2026-08-26-errorCodeTranslationsComplete.update.md` — **not** the
shadowed `ERROR_CODES` block inside `fa.json`), wording mirroring the existing
`PRODUCT_NOT_FOUND` / `CONTENT_SHOULD_HAVE_AT_LEAST_ONE_PRODUCT` entries. No other error
code needs a translation for this feature — checked the adapter's own thrown codes
(`dmCheckout.service.ts` et al.): the only other commerce code this flow can produce,
`PRODUCT_OUT_OF_STOCK`, is a DM reply written in Persian directly by the adapter, never an
HTTP response the dashboard needs to translate, and it already has an unrelated existing
`ErrorCodes.json` entry from before this feature.

Verified: `src/i18n/messages.test.ts` (the general `fa/ErrorCodes.json` guard) 8/8 pass;
`src/components/Automations` 26/26 pass, unchanged; the JSON file parses. Back-side
module reference: `Back/knowledge/core/commerce/instagramDmCheckout.doc.md`. Full Back
closeout: `Back/knowledge/updates/2026-09-01-buyInDirectPhase1.update.md`.

## Addendum (2026-09-03 — the product picker was always empty: missing `page`)

User-reported. Opening any automation at `/automations/:id` that carries a
«خرید در دایرکت» content showed an **empty product picker**, with no error anywhere in the
UI — the catalog just never arrived.

**Root cause.** `BuyInDirectContent.tsx` fetched
`GET /commerce/products?limit=100&status=active`. `ReadCommerceProductsDto`
(`Back/apps/core/src/commerce/catalog/dto/readCommerceProducts.dto.ts`) declares `page`
with `@IsNumber()` + `@Transform(numberTransformer('page'))` and **no `@IsOptional()` and
no default**, so `page` is required. `numberTransformer` maps the absent value to `null`
(its `if (!val) return null` branch — it never reaches the `NaN` throw), `@IsNumber()`
then rejects it, and the route answers:

```
HTTP 400  {"message":["page must be a number conforming to the specified constraints"],
           "error":"Bad Request","statusCode":400}
```

Reproduced against local `core` on `:3003`; the same request with `page=1` returns `200`.

**Fix.** One line — send `page=1`. Verified as the right layer rather than relaxing the
DTO: `page` is required in **12 of the 21** core list DTOs, the canonical
`apps/admin/src/users/dto/readUsers.dto.ts` that `CLAUDE.md` §13 points at requires it,
and every other caller of this exact route already sends it
(`ProductListPage.tsx:67`). Relaxing the backend instead would have been a contract
change to a shipped endpoint to accommodate one new caller.

**Why it was invisible.** The `.then(...)` chain ends in `.catch(() => {})` — a deliberate
"keep the picker empty on failure" swallow copied from `ProductContentItemDialog`. It
means *any* failure of this fetch, not just this one, renders as an ordinary empty
catalog. Surfacing that is a real follow-up, deliberately **not** done here: it changes
shared `packages/ui` behaviour for every content editor using the same pattern.

**Sibling sweep.** Every other `apiClient.get` in `packages/ui` was checked.
`ProductContentItemDialog.tsx:51` already sends `page`; `Contents.tsx:225`
(`/templates/:id`) and `BuyInDirectContent.tsx:171` (`/payments/cardToCard`) are
single-item routes; `InstagramPostSelectDialog.tsx:111` (`/posts/pure`) is cursor-based
and `ReadPureInstagramPostsDto` marks both params `@IsOptional()`. No other instance.

Verified: `packages/ui` whole suite 16 files / 155 tests pass (the new regression test
takes `BuyInDirectContent.test.tsx` from 8 to 9). The new test is mutation-proven — with
the `page=1` reverted, exactly that one test fails and the other 8 still pass, so it is
load-bearing rather than vacuous. Back untouched.

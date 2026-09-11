# Commerce Product Management (Dashboard) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard's legacy `/products` pages (which call now-removed backend
routes) with a new UI against `/commerce/...`, covering product list, product editor
(basic info, media, variants & pricing, inventory, categories/collections, shipping),
categories & collections management, and CSV/XLSX bulk import.

**Architecture:** Four Next.js route groups under `apps/dashboard/src/app/(Console)/products/`,
each backed by SWR reads + direct `api` (axios) mutation calls, following the exact
conventions already in `ProducstCardList.tsx`/`ProductForm.tsx` (header-slot actions, card-grid
lists, `react-hook-form` + zod, sonner toasts, `t_ec` error translation). No new
design-system components — reuse `@/components/ui` and `@/components/ui-custom` only.

**Tech Stack:** Next.js (App Router), SWR, react-hook-form + zod, axios, Tailwind, shadcn/radix
primitives already in `packages/ui`.

## Global Constraints

- Full design spec: `docs/superpowers/specs/2026-07-22-commerce-product-management-design.md`
  — read it before starting Task 1. It documents every screen against the REAL backend API
  (enumerated fresh from the Back branch) and lists 12 explicit corrections vs. the earlier
  approved mockup. Where a task below references "the mockup," it means the interactive
  design artifact (visual/interaction reference only) as corrected by that spec — the spec's
  field/endpoint contracts always win over the mockup where they differ.
- Money/quantity inputs: every price/stock/SKU-adjacent numeric field MUST use the canonical
  pattern from `apps/dashboard/src/components/Products/FormProductDetails.tsx` — `<Input
  onInput={onInputP2EHandler} value={formatNumber(field.value)} onFocus={onFocus}
  onChange={(e) => field.onChange(+e.target.value)} />` (CLAUDE.md §18). Never `type="number"`.
- All amounts are integers (تومان minor unit, matching backend `bigint` columns) — never
  send/parse floats.
- Every new user-facing string goes under a NEW `Commerce` i18n namespace in
  `apps/dashboard/src/messages/fa.json` (leave the legacy `Products` namespace's keys alone —
  don't delete until Task 11 removes the pages that use them; `en.json` gets the same keys,
  English translations may lag per CLAUDE.md §8 but keys must exist so `next-intl` doesn't
  throw MISSING_MESSAGE).
- Every mutation: permission-gate via `usePermissions().can(...)` (`product:view/create/
  edit/delete` — same slugs the legacy page used, confirmed still valid since
  `Back/knowledge/core/commerce/commerce.doc.md` states `PRODUCT_*` permission slugs were
  deliberately reused), `sonner` toast success/error via `t_ec(error.response?.data?.code)`,
  and `mutate(mutateIncludeStringKey('/commerce/products'))` (or the relevant list prefix)
  after every write.
- Header actions (search, primary "Add"/action button) go through
  `useHeaderFeatures().setButtons/setTools` in a page-level `useEffect` with cleanup — never
  inline in the page body.
- RTL throughout (inherited from `<html dir="rtl">` — no per-component dir handling needed
  except where `packages/ui`'s existing components already do it, e.g. `DataTable`/dialogs).

---

### Task 1: Shared commerce types + category tree utility + i18n scaffold

**Files:**
- Create: `apps/dashboard/src/types/commerce.ts`
- Create: `apps/dashboard/src/utils/commerce/buildCategoryTree.ts`
- Test: `apps/dashboard/src/utils/commerce/buildCategoryTree.test.ts`
- Modify: `apps/dashboard/src/messages/fa.json`, `apps/dashboard/src/messages/en.json`
  (add empty/placeholder `"Commerce": {}` root key — later tasks fill it in per screen)

**Interfaces produced (consumed by every later task — exact names/shapes, mirrors the real
backend DTOs from the spec 1:1, so no task has to re-derive them):**

```ts
// apps/dashboard/src/types/commerce.ts
export type CommerceProductStatus = 'draft' | 'active' | 'archived';
export type CommerceProductKind = 'physical' | 'digital';
export type CommerceOptionStyle = 'dropdown' | 'button' | 'color';
export type CommerceMediaType = 'image' | 'video';
export type CommerceStockMovementReason =
  | 'order' | 'refund' | 'manual' | 'import' | 'migration' | 'adjustment';

export interface CommerceProductListItem {
  id: string;
  title: string;
  slug: string;
  status: CommerceProductStatus;
  kind: CommerceProductKind;
  variantCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  needsStockReview: boolean;
  updateDate: string;
  coverMediaUrl: string | null;
}

export interface CommerceOptionValueDetail {
  id: string;
  value: string;
  colorHex: string | null;
  position: number;
}

export interface CommerceOptionDetail {
  id: string;
  name: string;
  style: CommerceOptionStyle;
  position: number;
  values: CommerceOptionValueDetail[];
}

export interface CommerceVariantMediaAssignment {
  selectedMediaIds: string[];
  coverMediaId: string | null;
}

export interface CommerceVariantDetail {
  id: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  salePrice: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  optionSignature: string;
  position: number;
  isActive: boolean;
  trackInventory: boolean;
  allowBackorder: boolean;
  weight: number | null;
  onHand: number;
  optionValueIds: string[];
  media?: CommerceVariantMediaAssignment; // populated lazily by Task 6, not in the GET detail
}

export interface CommerceProductDetail {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  slug: string;
  status: CommerceProductStatus;
  kind: CommerceProductKind;
  categoryId: string | null;
  needsStockReview: boolean;
  shippingCost: number;
  createDate: string;
  updateDate: string;
  options: CommerceOptionDetail[];
  variants: CommerceVariantDetail[];
}

export interface CommerceProductMedia {
  id: string;
  productId: string;
  fileId: number;
  type: CommerceMediaType;
  position: number;
  alt: string | null;
  url: string; // resolved by the upload response / GET media list — see Task 4
}

export interface CommerceCategory {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  parentId: string | null;
  position: number;
}

export interface CommerceCategoryNode extends CommerceCategory {
  children: CommerceCategoryNode[];
}

export interface CommerceCollectionListItem {
  id: string;
  name: string;
  slug: string;
  productIds: string[];
  createDate: string;
  updateDate: string;
}

export interface CommerceStockMovement {
  id: string;
  variantId: string;
  locationId: string;
  delta: number;
  reason: CommerceStockMovementReason;
  referenceId: string | null;
  actorId: string | null;
  createDate: string;
}

export interface PaginatedResult<T> {
  items: T;
  meta: {
    currentPage: number;
    itemCount: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}
```

- [ ] **Step 1: Write `buildCategoryTree` + its test first**

```ts
// apps/dashboard/src/utils/commerce/buildCategoryTree.ts
import { CommerceCategory, CommerceCategoryNode } from '@/types/commerce';

export function buildCategoryTree(flat: CommerceCategory[]): CommerceCategoryNode[] {
  const byId = new Map<string, CommerceCategoryNode>(
    flat.map((c) => [c.id, { ...c, children: [] }]),
  );
  const roots: CommerceCategoryNode[] = [];

  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (nodes: CommerceCategoryNode[]) => {
    nodes.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, 'fa'));
    nodes.forEach((n) => sortTree(n.children));
  };
  sortTree(roots);
  return roots;
}
```

```ts
// apps/dashboard/src/utils/commerce/buildCategoryTree.test.ts
import { buildCategoryTree } from './buildCategoryTree';
import { CommerceCategory } from '@/types/commerce';

const cat = (o: Partial<CommerceCategory> & { id: string; name: string }): CommerceCategory => ({
  workspaceId: 'ws-1', slug: o.name, parentId: null, position: 0, ...o,
});

describe('buildCategoryTree', () => {
  it('nests children under their parent, sorted by position', () => {
    const flat = [
      cat({ id: 'food', name: 'خوراکی', position: 0 }),
      cat({ id: 'organic', name: 'ارگانیک', parentId: 'food', position: 1 }),
      cat({ id: 'nuts', name: 'خشکبار', parentId: 'food', position: 0 }),
    ];
    const tree = buildCategoryTree(flat);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('food');
    expect(tree[0].children.map((c) => c.id)).toEqual(['nuts', 'organic']);
  });

  it('treats a dangling parentId (parent not in the list) as a root', () => {
    const flat = [cat({ id: 'orphan', name: 'یتیم', parentId: 'missing-parent' })];
    expect(buildCategoryTree(flat)).toHaveLength(1);
  });

  it('returns [] for an empty list', () => {
    expect(buildCategoryTree([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test** — `pnpm --filter front test buildCategoryTree` (or the
  workspace's existing test runner invocation for `apps/dashboard` — check
  `apps/dashboard/package.json`'s `test` script and use that exact command). Expected: 3/3 pass.
- [ ] **Step 3: Add the `Commerce` namespace root** to both message files (just `"Commerce":
  {}` — later tasks each add their own keys under it, so this step never conflicts with them).
- [ ] **Step 4: Commit** — `git add apps/dashboard/src/types/commerce.ts
  apps/dashboard/src/utils/commerce/ apps/dashboard/src/messages/fa.json
  apps/dashboard/src/messages/en.json && git commit -m "feat(commerce): shared types + category tree util"`

---

### Task 2: Product list page

**Files:**
- Create: `apps/dashboard/src/components/Commerce/ProductList/ProductListPage.tsx` (the
  page's client component — mirrors `ProducstCardList.tsx`'s structure exactly)
- Create: `apps/dashboard/src/components/Commerce/ProductList/CommerceProductCard.tsx`
- Modify: `apps/dashboard/src/app/(Console)/products/page.tsx` (repoint to the new component
  — keep the file, replace its body)
- Test: `apps/dashboard/src/components/Commerce/ProductList/ProductListPage.test.tsx`

**Interfaces:**
- Consumes: `CommerceProductListItem`, `PaginatedResult` (Task 1).
- Produces: nothing new consumed elsewhere — this is a leaf page.

**Spec reference:** Design spec "Screen 1 — Product list". Card shows `coverMediaUrl` (real
photo, `null` → type-icon placeholder), price as a single value if `minPrice === maxPrice`
else "از {minPrice} تومان", `needsStockReview` badge, status chip filter (active/draft/
archived — no sort chip, no out-of-stock chip, per the spec's corrections list items 1 & 3).

- [ ] **Step 1: Build `ProductListPage.tsx`** following `ProducstCardList.tsx`'s exact shape:
  `useSWRImmutable<PaginatedResult<CommerceProductListItem[]>>` on
  `` `/commerce/products?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}${search ? `&search=${debouncedSearch}` : ''}` ``,
  same debounce/pagination/delete-dialog wiring, `DeleteConfirmationDialog` +
  `api.delete('/commerce/products/:id')` + `mutate(mutateIncludeStringKey('/commerce/products'))`.
  Status filter chips (`فعال`/`پیش‌نویس`/`آرشیو شده`/همه) as local `useState<CommerceProductStatus
  | undefined>`, no chip for sort or out-of-stock (spec correction).
- [ ] **Step 2: Build `CommerceProductCard.tsx`** — 4:3 media tile (`coverMediaUrl` as
  `<img>` `object-cover`, else a type-based icon on a neutral background), title, type badge
  (`فیزیکی`/`دیجیتال`), `needsStockReview` warning badge when true, price
  (single value or range per the spec rule above), footer edit/delete buttons (`edit` →
  `router.push('/products/' + id)`, `delete` → the parent's `handleDelete`). Mirror
  `ProductCard.tsx`'s existing memo/footer-button styling exactly (50/50 split, hover
  green/red), just swap the field bindings.
- [ ] **Step 3: Wire the header** — `useHeaderFeatures().setButtons` with a "کالای جدید"
  button (`router.push('/products/add')`), permission-gated on `can('product:create')`;
  `setTools` with the existing `SearchInput`/`SearchToggleButton` pair.
- [ ] **Step 4: Add `Commerce.List.*` i18n keys** (title, statuses, price range copy "از
  {price} تومان", empty state, needsStockReview badge label, delete toast).
- [ ] **Step 5: Write `ProductListPage.test.tsx`** — mock SWR (`jest.mock('swr/immutable')`
  matching the existing test setup pattern in the repo for other list pages, e.g. Contacts'
  test if one exists) asserting: loading state renders `LoaderSpin`, empty state renders the
  empty-state text, a `needsStockReview: true` item renders the warning badge, a
  `minPrice !== maxPrice` item renders the range copy, a `minPrice === maxPrice` item renders
  the single price.
- [ ] **Step 6: Run tests** for this file only.
- [ ] **Step 7: Commit.**

---

### Task 3: Product editor shell — routing, scrollspy nav, Basic Info + Shipping sections, create/update submit

**Files:**
- Create: `apps/dashboard/src/components/Commerce/ProductEditor/ProductEditorPage.tsx`
- Create: `apps/dashboard/src/components/Commerce/ProductEditor/EditorScrollspyNav.tsx`
- Create: `apps/dashboard/src/components/Commerce/ProductEditor/sections/BasicInfoSection.tsx`
- Create: `apps/dashboard/src/components/Commerce/ProductEditor/sections/ShippingSection.tsx`
- Create: `apps/dashboard/src/components/Commerce/ProductEditor/productForm.schema.ts` (zod)
- Modify: `apps/dashboard/src/app/(Console)/products/add/page.tsx`,
  `apps/dashboard/src/app/(Console)/products/[id]/page.tsx`,
  `apps/dashboard/src/app/(Console)/products/[id]/product.tsx`
- Test: `apps/dashboard/src/components/Commerce/ProductEditor/EditorScrollspyNav.test.tsx`

**Interfaces:**
- Consumes: `CommerceProductDetail`, `CommerceOptionDetail`, `CommerceVariantDetail` (Task 1).
- Produces: the shared `react-hook-form` context (`useFormContext<ProductFormValues>()`)
  every later editor task (4, 5, 6, 7, 8) reads from and writes into — defined here so later
  tasks don't invent conflicting field names:

```ts
// productForm.schema.ts (shape only — full zod validators are this task's own work)
export interface ProductFormValues {
  title: string;
  description: string;
  status: CommerceProductStatus;
  kind: CommerceProductKind;
  categoryId: string | null;
  shippingCost: number;
  options: Array<{
    id?: string;
    name: string;
    style: CommerceOptionStyle;
    values: Array<{ id?: string; value: string; colorHex?: string }>;
  }>;
  variants: Array<{
    id?: string;
    valueIndexes: number[]; // positional, matches the backend's VariantDto exactly
    sku?: string;
    price: number;
    compareAtPrice?: number;
    salePrice?: number;
    saleStartsAt?: string;
    saleEndsAt?: string;
    isActive: boolean;
    trackInventory: boolean;
    allowBackorder: boolean;
    weight?: number;
    initialStock?: number; // create-time only; edits go through Task 7's stock endpoint
  }>;
}
```

- [ ] **Step 1: Build the scrollspy nav** exactly as prototyped in the approved mockup
  (`IntersectionObserver` re-highlighting the current section on scroll; click →
  `scrollIntoView({behavior: 'smooth', block: 'start'})`; on mobile — `max-width: 900px` —
  degrade to a horizontal tab bar showing one section at a time, matching the mockup's
  `@media` behavior 1:1). Six section ids: `basic`, `media`, `variants`, `inventory`, `org`,
  `shipping`. Only `basic`/`shipping` are populated in this task — the rest render as an
  empty `<Card>` placeholder that Tasks 4/5/6/7/8 will each fill in (so the nav/scroll
  mechanism is provable end-to-end before those tasks start).
- [ ] **Step 2: Build `BasicInfoSection.tsx`** — `title`/`description`/`status`/`kind`
  (`Select`, `kind` disabled + tooltip once `useFormContext` sees the product has any
  existing variant with `id` set AND the product isn't brand-new — i.e. edit-mode with
  ≥1 saved variant; exact gating rule: spec says "locked once the product has ≥1 order
  line," which the frontend cannot know without an extra check — for v1, disable `kind`
  whenever editing an existing product at all, and rely on the backend's `COMMERCE_KIND_LOCKED`
  error only for the from a race where the product had 0 orders at page-load but the field was
  still editable; surface that error via `t_ec` if it ever fires), `categoryId` single
  `Select` populated from `GET /commerce/categories` + `buildCategoryTree` (indent by depth
  in the option labels).
- [ ] **Step 3: Build `ShippingSection.tsx`** — one `shippingCost` field, canonical
  money-input pattern. No free-shipping toggle (spec correction item 10).
- [ ] **Step 4: Build `ProductEditorPage.tsx`** — owns the `useForm<ProductFormValues>`
  instance (zod resolver), fetches `GET /commerce/products/:id` when editing (`useSWR`,
  `skip` when `mode === 'create'`), maps the response into form defaults, renders the sticky
  save-bar (`ذخیرهٔ تغییرات` / `انصراف`), and on submit:
  - create: `POST /commerce/products` with the full nested payload (this task builds
    `options`/`variants` empty-safe defaults; Task 5 is what actually lets the user edit them,
    but the payload-building function must exist here since submit needs it)
  - edit: `PUT /commerce/products/:id`
  - both: `toast.success` + `router.push('/products/' + id)` on success, `toast.error(t_ec(code))`
    on failure (including a specific message for `COMMERCE_KIND_LOCKED`).
- [ ] **Step 5: Wire `add/page.tsx` and `[id]/page.tsx`/`product.tsx`** to render
  `<ProductEditorPage mode="create" />` / `<ProductEditorPage mode="edit" productId={id} />`
  — delete the old `ProductForm`/`ProductFormSkeleton` usage in these files (the component
  files themselves are deleted in Task 11, once nothing references them).
- [ ] **Step 6: `Commerce.Editor.*` i18n keys** for this task's fields + nav labels for all
  6 sections (later tasks reuse the nav labels already added here, they don't re-add them).
- [ ] **Step 7: Write `EditorScrollspyNav.test.tsx`** — asserts clicking a nav button calls
  `scrollIntoView` on the right section ref, and that `IntersectionObserver`'s callback
  (mocked) updates the active class.
- [ ] **Step 8: Run tests, commit.**

---

### Task 4: Media section — pool CRUD + reorder

**Files:**
- Create: `apps/dashboard/src/components/Commerce/ProductEditor/sections/MediaSection.tsx`
- Modify: `apps/dashboard/src/components/Commerce/ProductEditor/ProductEditorPage.tsx` (wire
  `sec-media` placeholder → real component; media isn't part of `ProductFormValues` since
  it's mutated via its own endpoints immediately, not batched into the product PUT — see
  below)
- Test: `apps/dashboard/src/components/Commerce/ProductEditor/sections/MediaSection.test.tsx`

**Interfaces:**
- Consumes: `CommerceProductMedia`, `CommerceProductDetail.media` (Task 1, corrected in
  commit `e5e4b7a3` after the backend gap this section originally flagged as unresolved was
  fixed — the Back branch has NO dedicated GET media-list route; `media[]` comes back inline
  on `GET /commerce/products/:id`, the exact same fetch `ProductEditorPage.tsx` already makes
  in edit mode). `CommerceProductMedia` is `{id, type, position, alt, url, posterUrl}` — no
  `productId`/`fileId` (internal-only backend fields, never exposed), `posterUrl` is the
  resolved poster-frame URL for video media (`null` for images).
- Requires `productId` — **this section is disabled with an explanatory message ("ابتدا کالا
  را ذخیره کنید تا بتوانید تصویر اضافه کنید") until the product has been saved once** (i.e.
  `mode === 'edit'`, or create has already succeeded once and redirected) — matches the real
  API, which has no "attach media to an unsaved product" concept.
- **Architecture, resolved**: do NOT maintain a separate local `useState` for the media
  array. `MediaSection.tsx` reads `media` off the SAME `useSWR` cache entry
  `ProductEditorPage.tsx` already populates for `GET /commerce/products/:id` (pass the SWR
  key + fetched data down, or call `useSWR` again with the identical key so it dedupes
  against the same cache). **Every mutation** — upload, delete, reorder — calls the
  mutation endpoint, then `mutate()`s that SAME product-detail SWR key to refetch and get
  the authoritative list back (this is also how a freshly-uploaded image gets a real `url`:
  `POST .../media`'s own response returns the raw entity with NO resolved url at all, so
  don't try to render straight from the POST response — revalidate instead). Task 6
  (per-variant media picker) reads the same cached `media` array this task establishes as
  the pattern, not a separate fetch.

- [ ] **Step 1: Build the upload dropzone** using the existing `FileUploader` (`multiple`
  mode) → `POST /commerce/products/:id/media` (multipart, one request per file if multiple
  are dropped at once — the endpoint accepts one file per call). On each successful upload,
  `mutate()` the product-detail SWR key (don't try to construct a tile from the POST
  response — it has no resolved `url`). `toast.success` once all uploads in a batch settle.
- [ ] **Step 2: Build the reorder grid** — drag via `@dnd-kit` (already a project dependency,
  see `SortableButtonItem.tsx`/`dnd.tsx` for the exact pattern to copy), on drop call
  `PATCH /commerce/products/:id/media` with the full reordered `mediaIds[]`, then `mutate()`
  the same SWR key. First position renders a "شاخص" cover badge (implicit, no separate flag
  — per spec). For instant visual feedback before the refetch resolves, it's fine to
  optimistically reorder the local render via SWR's `mutate(key, optimisticData, {revalidate:
  true})` rather than a second parallel local state array.
- [ ] **Step 3: Delete button per tile** → `DELETE /commerce/products/:id/media/:mediaId`,
  then `mutate()` the SWR key (same pattern as upload/reorder — one consistent mutate-then-
  revalidate flow for all three mutations, no bespoke optimistic-rollback logic per action).
- [ ] **Step 4: `Commerce.Editor.Media.*` i18n keys.**
- [ ] **Step 5: Write `MediaSection.test.tsx`** — upload success triggers the SWR mutate
  (assert the mutate/refetch call, not a locally-appended tile), reorder calls the PATCH
  with the right id order, delete calls the DELETE then triggers mutate. Include one video
  fixture (`type: 'video'`, non-null `posterUrl`) to prove the poster image renders instead
  of trying to play/embed the video inline.
- [ ] **Step 6: Run tests, commit.**

---

### Task 5: Variants & pricing section — options builder + generated variant table

**Files:**
- Create: `apps/dashboard/src/components/Commerce/ProductEditor/sections/VariantsSection.tsx`
- Create: `apps/dashboard/src/components/Commerce/ProductEditor/variantMatrix.util.ts`
- Test: `apps/dashboard/src/components/Commerce/ProductEditor/variantMatrix.util.test.ts`

**Interfaces:**
- Consumes/produces: `ProductFormValues['options']` / `['variants']` (Task 3's shared form
  context) — this task is the only one that mutates them via `useFieldArray`.

**Spec reference:** max 3 options (`OPTION_LIMIT`), max 2000 variants (`VARIANT_LIMIT`, hard
error not silent truncation), `valueIndexes` are positional not UUIDs, `compareAtPrice >
price`, `salePrice < price`, `salePrice`+`saleStartsAt` set together, `allowBackorder` field
(new vs. mockup), at least one active variant always (client-side pre-check).

- [ ] **Step 1: Write `variantMatrix.util.ts`** — the cartesian-product generator (pure
  function, easiest to unit test in isolation):

```ts
// Cartesian product of each option's value INDEXES (not the values themselves) — matches
// the backend's positional valueIndexes contract directly, so the caller never has to
// re-map ids to indexes later.
export function generateVariantCombinations(
  optionValueCounts: number[], // e.g. [3, 2] for a 3-value option + a 2-value option
): number[][] {
  if (optionValueCounts.length === 0) return [[]];
  return optionValueCounts.reduce<number[][]>(
    (acc, count) => acc.flatMap((combo) => Array.from({ length: count }, (_, i) => [...combo, i])),
    [[]],
  );
}

export const VARIANT_LIMIT = 2000;
export const OPTION_LIMIT = 3;
```
- [ ] **Step 2: Test it** — `[3,2]` → 6 combos, `[]` → `[[]]` (default single variant, no
  options), a size that would exceed `VARIANT_LIMIT` is the CALLER's job to reject before
  calling `generateVariantCombinations` (this function itself doesn't throw — keep it pure).
- [ ] **Step 3: Build the options builder UI** — up to 3 option rows (name + style picker:
  dropdown/button/color — mockup didn't have the style picker, this is a spec addition;
  for `style === 'color'`, values also get a `colorHex` field with a small swatch input),
  chip-based value entry (matches mockup), drag-reorder rows.
- [ ] **Step 4: Wire "بازسازی جدول تنوع‌ها"** — compute `optionValueCounts =
  options.map(o => o.values.length)`, guard `product of counts > VARIANT_LIMIT` with a
  blocking error toast (not a silent cap), else call `generateVariantCombinations`, diff
  against existing `variants` (keep an existing variant's `id`/price/stock if its
  `valueIndexes` combination still exists after regeneration, only append/remove the
  delta) — **do not blindly discard the whole array on every regenerate, that would lose a
  user's already-entered prices** (this is a real UX gap the mockup's demo glossed over
  since it always started fresh).
- [ ] **Step 5: Build the variant table** — columns per the spec: drag handle, media button
  (placeholder here, Task 6 fills in the real picker), variant label (derived from
  `valueIndexes` → option value names), SKU, price/compareAtPrice/salePrice+dates (money
  pattern, `compareAtPrice`/`salePrice` validated inline via zod `.refine` matching the
  backend's rules exactly so the user sees the error before submit, not after a 400), stock
  (`initialStock`, create-mode only — edit-mode routes stock changes through Task 7 instead
  and this column becomes read-only "برای تغییر به بخش موجودی بروید"), `trackInventory`/
  `allowBackorder`/`isActive` switches, delete-row button (blocked with an inline message if
  it's the last active variant).
- [ ] **Step 6: `Commerce.Editor.Variants.*` i18n keys.**
- [ ] **Step 7: Run `variantMatrix.util.test.ts`, commit.**

---

### Task 6: Per-variant media picker

**Files:**
- Create: `apps/dashboard/src/components/Commerce/ProductEditor/VariantMediaPickerDialog.tsx`
- Modify: `VariantsSection.tsx` (wire the real media button from Task 5's placeholder)

**Interfaces:** Consumes the media list resolved by Task 4 (whatever GET path Task 4's
Step 1 confirmed). Calls `PUT /commerce/products/:id/variants/:variantId/media` with
`{mediaIds, coverMediaId?}` — **replace semantics**, always send the full desired set, not a
delta.

- [ ] **Step 1: Build the dialog** — grid of the product's pool media as selectable tiles
  (click toggles inclusion, star button sets cover — auto-includes if not already selected,
  exactly as prototyped in the mockup), subtitle showing the variant's label.
- [ ] **Step 2: Save handler** — `PUT .../variants/:variantId/media`, empty `mediaIds: []`
  clears the variant's override (falls back to the product's implicit cover — no separate
  "reset" button needed, an empty selection already means that).
- [ ] **Step 3: Thumbnail button in the variant table** shows the variant's own cover if
  set, else a dashed "uses product cover" placeholder (exact mockup behavior).
- [ ] **Step 4: `Commerce.Editor.VariantMedia.*` i18n keys.**
- [ ] **Step 5: Component test** — selecting a tile then saving calls the PUT with the right
  `mediaIds`/`coverMediaId`; clearing all selections sends `mediaIds: []`.
- [ ] **Step 6: Run test, commit.**

---

### Task 7: Inventory section — ledger + balance reconstruction + adjust stock

**Files:**
- Create: `apps/dashboard/src/components/Commerce/ProductEditor/sections/InventorySection.tsx`
- Create: `apps/dashboard/src/components/Commerce/ProductEditor/reconstructLedgerBalances.util.ts`
- Create: `apps/dashboard/src/components/Commerce/ProductEditor/AdjustStockDialog.tsx`
- Test: `apps/dashboard/src/components/Commerce/ProductEditor/reconstructLedgerBalances.util.test.ts`

**Spec reference (important corrections, re-stated so this task doesn't drift back toward
the mockup's shape)**: `GET /commerce/products/:id/movements/:variantId?page&limit` returns
`CommerceStockMovement[]` — **no note field, no stored resulting-balance column.** Drop the
mockup's "یادداشت" input/column entirely. `PATCH /commerce/products/:id/stock` body is
`[{variantId, onHand, lowStockThreshold?}]` — `onHand` is the **absolute target**, not a
delta; the mockup's "نوع تغییر" dropdown has no backend counterpart and must not be
presented as if it's persisted.

- [ ] **Step 1: Write `reconstructLedgerBalances.util.ts`** (pure, easiest to unit test):

```ts
import { CommerceStockMovement } from '@/types/commerce';

export interface MovementWithBalance extends CommerceStockMovement {
  balanceAfter: number;
}

// `movements` must be DESC-ordered by createDate (the API's own order). `currentOnHand` is
// the variant's live on-hand count. Walking newest→oldest, this row's "balance after" is
// whatever the running balance was BEFORE we subtract this row's delta for the next
// (older) row.
export function reconstructLedgerBalances(
  movements: CommerceStockMovement[],
  currentOnHand: number,
): MovementWithBalance[] {
  let running = currentOnHand;
  return movements.map((m) => {
    const balanceAfter = running;
    running -= m.delta;
    return { ...m, balanceAfter };
  });
}
```
- [ ] **Step 2: Test it** — 3 movements with known deltas + a known `currentOnHand` produce
  the expected descending balance sequence; an empty list returns `[]`.
- [ ] **Step 3: Build the ledger table** — `reason` → Persian label (`order` → "سفارش
  #{referenceId}", `import` → "وارد کردن گروهی", `migration` → "مهاجرت داده", `manual`/
  `adjustment` → "دستی", `refund` → "بازگشت وجه"), `delta` with sign + color (green
  positive/red negative), `balanceAfter` column (tabular-nums). No note column.
- [ ] **Step 4: Build `AdjustStockDialog.tsx`** — shows current `onHand`, a single "موجودی
  جدید" number input (not a delta+reason-type dropdown pretending to be persisted — a
  lightweight "افزایش/کاهش" toggle MAY stay purely as a UI helper that flips the sign of a
  delta the user types and computes `onHand = current + delta` for display before submit,
  but the request body only ever sends the final absolute `onHand`), optional
  `lowStockThreshold`. Submits `PATCH /commerce/products/:id/stock` with a single-entry
  array.
- [ ] **Step 5: `Commerce.Editor.Inventory.*` i18n keys** (including the 5 reason labels).
- [ ] **Step 6: Run `reconstructLedgerBalances.util.test.ts`, commit.**

---

### Task 8: Categories & collections assignment (within the product editor)

**Files:**
- Create: `apps/dashboard/src/components/Commerce/ProductEditor/sections/CollectionsSection.tsx`
- Create: `apps/dashboard/src/utils/commerce/toggleProductInCollection.ts`
- Test: `apps/dashboard/src/utils/commerce/toggleProductInCollection.test.ts`

**Spec reference**: category assignment is just `categoryId` (already handled in Task 3's
Basic Info — this section does NOT re-implement category assignment, spec correction item
5). This section only handles collection membership, which has **no product-scoped
endpoint** — toggling here does a read-modify-write against
`PUT /commerce/collections/:id` with the collection's full `productIds[]`.

- [ ] **Step 1: Write `toggleProductInCollection.ts`** — the read-modify-write helper, named
  explicitly so its replace-semantics aren't hidden:

```ts
import { CommerceCollectionListItem } from '@/types/commerce';

/** Returns the new FULL productIds[] to PUT back — this replaces the collection's entire
 * membership, it does not append/remove server-side. Caller must PUT the result. */
export function toggleProductInCollectionMembership(
  collection: CommerceCollectionListItem,
  productId: string,
): string[] {
  const isMember = collection.productIds.includes(productId);
  return isMember
    ? collection.productIds.filter((id) => id !== productId)
    : [...collection.productIds, productId];
}
```
- [ ] **Step 2: Test it** — toggling on/off both directions, no-op-safe on an already-absent id.
- [ ] **Step 3: Build the section UI** — chip list of `GET /commerce/collections` results,
  active chips = collections whose `productIds` include this product; clicking a chip calls
  `toggleProductInCollectionMembership` then `PUT /commerce/collections/:id` with the
  result, `mutate` the collections list key.
- [ ] **Step 4: `Commerce.Editor.Collections.*` i18n keys.**
- [ ] **Step 5: Run test, commit.**

---

### Task 9: Categories & collections management screen

**Files:**
- Create: `apps/dashboard/src/app/(Console)/products/taxonomy/page.tsx`
- Create: `apps/dashboard/src/components/Commerce/Taxonomy/CategoryTree.tsx`
- Create: `apps/dashboard/src/components/Commerce/Taxonomy/CollectionsList.tsx`
- Create: `apps/dashboard/src/components/Commerce/Taxonomy/CategoryDialog.tsx`,
  `CollectionDialog.tsx`
- Test: `apps/dashboard/src/components/Commerce/Taxonomy/CategoryTree.test.tsx`

**Spec reference**: NO manual/rule-based collection-type concept exists on the backend —
do not build that toggle (spec correction item 6). Category tree is built client-side from
`buildCategoryTree` (Task 1); reorder/re-parent writes back via
`PUT /commerce/categories/:id` with new `parentId`/`position`.

- [ ] **Step 1: `CategoryTree.tsx`** — render `buildCategoryTree(categories)` recursively,
  drag-and-drop re-parent/reorder (`@dnd-kit`, same pattern as Task 4's media reorder) →
  `PUT /commerce/categories/:id`. Delete blocked server-side
  (`COMMERCE_CATEGORY_IN_USE`/`COMMERCE_CATEGORY_CYCLE`) — surface both via `t_ec`.
- [ ] **Step 2: `CategoryDialog.tsx`** — create/edit form (`name`, `parentId` select built
  from the same tree, excluding the category's own subtree when editing to prevent a
  self-cycle attempt client-side before the server's cycle check even runs).
- [ ] **Step 3: `CollectionsList.tsx`** — card list from `GET /commerce/collections`, each
  showing `productIds.length` as "{n} کالا" — no manual/auto badge (spec correction item 6).
- [ ] **Step 4: `CollectionDialog.tsx`** — create/edit form: `name` only (no type toggle).
  Editing an existing collection's product list is done from the product editor (Task 8),
  not here — this dialog is name-only, matching what `UpsertCommerceCollectionDto` actually
  needs beyond `productIds` (which stays untouched unless Task 8's flow changes it).
- [ ] **Step 5: `taxonomy/page.tsx`** — two-pane layout (`LayoutPage`), wires both lists +
  their "new" buttons into the header via `useHeaderFeatures`.
- [ ] **Step 6: `Commerce.Taxonomy.*` i18n keys.**
- [ ] **Step 7: `CategoryTree.test.tsx`** — renders nested children correctly, reorder drag
  calls the PUT with expected `parentId`/`position`.
- [ ] **Step 8: Run tests, commit.**

---

### Task 10: Bulk import screen

**Files:**
- Create: `apps/dashboard/src/app/(Console)/products/import/page.tsx`
- Create: `apps/dashboard/src/components/Commerce/Import/ImportWizard.tsx`
- Create: `apps/dashboard/src/components/Commerce/Import/useImportJobPolling.ts`
- Test: `apps/dashboard/src/components/Commerce/Import/useImportJobPolling.test.ts`
- Create (static asset, not code): a sample `.csv` matching the exact 17-column header row
  from the spec, served from `apps/dashboard/public/commerce-import-sample.csv`

**Spec reference (structural correction from the mockup, re-stated)**: 3 real steps, not 4 —
Upload → Processing (poll) → Result. No client-side column-mapping step, no client-side
pre-submit validation-preview step (the backend has a fixed column order and validates only
inside the async job).

- [ ] **Step 1: Write `useImportJobPolling.ts`** — a small hook: given a `jobId`, polls
  `GET /commerce/import/:jobId` on an interval (~1.5s) via `useSWR` with `refreshInterval`,
  stopping (`refreshInterval: 0`) once `state` is a terminal value (`completed`/`failed`).
  Pure enough to unit test with a mocked fetcher returning a sequence of states.
- [ ] **Step 2: Test it** — asserts the hook stops polling once a terminal state is reached
  (refreshInterval becomes 0 on the next render).
- [ ] **Step 3: Build the sample file** with the exact header row: `title, description,
  status, kind, category, option1Name, option1Value, option2Name, option2Value,
  option3Name, option3Value, sku, price, compareAtPrice, stock, trackInventory, weight` plus
  2-3 example data rows (physical + digital, one with 1 option, one with none) — this file
  is load-bearing (linked from the wizard), not decorative.
- [ ] **Step 4: Build `ImportWizard.tsx`** — Step 1 dropzone (`.csv/.xlsx/.xls`, `FileUploader`
  single-file mode) → `POST /commerce/import` multipart → `jobId`. Step 2: spinner +
  `processed` counter driven by Step 1's hook. Step 3: `processed`/`failed` summary tiles;
  if `errorReportFileId` present, a "دانلود گزارش خطاها" link — resolve the id to a
  downloadable URL via whatever existing file-download route the excel-export feature
  already uses (grep `apps/dashboard/src` for its download-link pattern and reuse it
  verbatim, don't invent a new one).
- [ ] **Step 5: `Commerce.Import.*` i18n keys.**
- [ ] **Step 6: Run test, commit.**

---

### Task 11: Wire sidebar navigation, remove legacy Products code

**Files:**
- Modify: `apps/dashboard/src/components/Layout/ConsoleSidebar.tsx` (or wherever `NavMain`'s
  item array lives) — add `taxonomy`/`import` as children under the existing "کالاها و
  خدمات" nav item, matching the approved mockup's sidebar structure.
- Delete: `apps/dashboard/src/components/Products/` (entire folder — `ProductForm.tsx`,
  `FormProductDetails.tsx`, `FormCustomFields.tsx`, `FormShippingCost.tsx`,
  `FormVitrinDetails.tsx`, `FormVitrinButtons.tsx`, `ProducstCardList.tsx`, `ProductCard.tsx`,
  `SortableButtonItem.tsx`, `SortableFieldItem.tsx`)
- Delete: `apps/dashboard/src/app/(Console)/products/components/` (entire folder — includes
  both the confirmed-dead files from the design-research pass and `product.form.skeleton.tsx`,
  which WAS live until this task replaces its only caller)
- Delete: `apps/dashboard/src/types/product.ts` (legacy `ProductNamespace` — confirm nothing
  outside the deleted files imports it before removing; if something does, leave it and note
  why in the commit message instead of silently keeping dead code)

**Order matters: this task runs LAST**, only once Tasks 2-10 have fully replaced every
legacy page's functionality — deleting first would break the app mid-plan if execution is
interrupted between tasks.

- [ ] **Step 1: Grep-confirm** no remaining imports of anything under
  `src/components/Products/`, `app/(Console)/products/components/`, or `src/types/product.ts`
  outside the files being deleted.
- [ ] **Step 2: Add the 2 nav children** to the sidebar's `products` item.
- [ ] **Step 3: Delete the confirmed-dead files.**
- [ ] **Step 4: Full `tsc --noEmit` on `apps/dashboard`** (ask before running, per standing
  instruction) to confirm no dangling imports were missed.
- [ ] **Step 5: Commit** as its own commit (cleanup, separate from any feature commit).

---

## Post-plan (not a task — handled by the execution skill itself)

Once all 11 tasks are done and individually reviewed, dispatch the final whole-branch
review per `superpowers:subagent-driven-development`'s process, then
`superpowers:finishing-a-development-branch` — do NOT merge without the user's explicit
confirmation (CLAUDE.md §0).

# Commerce Product Core — Security Review Fixes (Front side)

Front half of the `/security-review` fix pass on `feat/commerce-product-core`. The
substantive fixes are all backend; see
`Back/knowledge/updates/2026-07-25-commerceSecurityReviewFixes.update.md` for the full
findings and their remediation.

## Front security result: clean

The frontend finder found **no vulnerabilities** and required no code changes. Verified by
grep against the working tree rather than diff-only inference:

- Zero unsafe rendering sinks across all new commerce code — no `dangerouslySetInnerHTML`,
  `innerHTML`, `outerHTML`, `document.write`, `eval`, `new Function`, or `javascript:`.
  Every product title, description, category/collection name, SKU and option value renders
  through ordinary JSX interpolation, which React escapes.
- The import error-report download anchor (`ImportWizard.tsx`) was traced end to end: its
  `href` comes from `GET /commerce/import/:jobId`'s `errorReportUrl`, which the backend
  builds from a CDN base plus a stored `FileEntity` key resolved from a numeric file id —
  never from an uploaded filename or a spreadsheet cell, so a `javascript:`/`data:` scheme
  is not reachable without a backend compromise. That endpoint is also workspace-scoped.
- Media URLs feed `next/image` (which rejects non-allowlisted remotes); the one raw
  `<img src>` is not an XSS sink (`javascript:` in `img@src` does not execute).
- No secrets, no `localStorage`/`document.cookie`/`Bearer` handling, no new `console`
  logging. The diff actually removes two `console` calls along with the legacy components.
- Client-side `can('product:…')` gates are present and correctly documented as advisory —
  per review policy the backend is the trust boundary either way.

## Changes

i18n only, satisfying CLAUDE.md §10 (a new backend error code requires a matching
`ERROR_CODES` translation):

- `apps/dashboard/src/messages/fa.json` — added four `ERROR_CODES` entries:
  - `ORDER_QUANTITY_INVALID` — the new order-level guard rejecting non-positive quantities.
  - `COMMERCE_INVALID_QUANTITY` — the new `InventoryService` guard on `decrement`/`restock`.
  - `COMMERCE_INVALID_MEDIA` — already thrown by the backend (now also for a failed image
    content-sniff) but never translated, so it would have surfaced as a raw code.
  - `COMMERCE_CATEGORY_NOT_FOUND` — same situation; now also used for the import's
    permission-gated category path.

## Behaviour note (no Front code change needed)

The backend's public buyer route (`GET /v1/products/:id`) now gates the real `quantity` on
workspace **ownership** rather than mere authentication. Anonymous buyers — the actual
consumers of that route in the DM order flow — see exactly what they saw before
(`quantity` omitted when in stock, `0` when out of stock), so the buyer pages are
unaffected. Only a logged-in platform user viewing a *different* workspace's product loses
the real number, which is the point of the fix.

## Verification

- `python3 -c "import json; json.load(...)"` on `fa.json` — valid JSON after the edit.
- No Front source changed, so no test or typecheck delta on this side; the Back doc carries
  the 110/110 test and `tsc` results for the fixes themselves.

# Breadcrumb Translations (2026-08-10)

## Problem

Both breadcrumb components (`HeaderBreadcrumb.tsx` in dashboard, `app-breadcrumb.tsx`
in admin) map a URL path segment to a translated label via a static `segment → i18n key`
table, then call `t(key)`. Two gaps broke that pattern:

- **Admin had a literal hardcoded string.** `app-breadcrumb.tsx` returned `'جزئیات'`
  directly for any UUID path segment instead of calling `t('detail')` — it never
  respected the active locale, unlike dashboard's equivalent case which already used
  `t('detail')` correctly.
- **Both apps silently fell through to the raw route slug** (`decodeURIComponent(segment)`)
  for any static segment missing from the map, instead of surfacing a translated label.
  Auditing every real route (folders containing `page.tsx`) against each map found
  untranslated static segments: dashboard was missing `support`, `install`,
  `invitations`, `sendAll` (and had a dead reference to a nonexistent `Breadcrumbs.edit`
  key); admin was missing `add` (used at `/templates/add`).

## Solution

- `apps/admin/src/components/app-breadcrumb.tsx`: UUID case now calls `t('detail')`;
  added `add: t('add')` to the segment map.
- `apps/dashboard/src/components/Layout/HeaderBreadcrumb.tsx`: added `support`,
  `install`, `invitations`, `sendAll` cases to `knownSegmentKey()`.
- `apps/dashboard/src/messages/fa.json` (`Breadcrumbs` namespace): added `support`,
  `install`, `invitations`, `sendAll`, and `edit` (the switch already referenced this
  key for a currently-unreachable `edit` segment; added it so it never silently
  breaks if an `/edit` route is added later).
- `apps/admin/src/messages/fa.json` (`Sidebar` namespace, reused for admin breadcrumbs):
  added `detail` and `add`.

The `decodeURIComponent(segment)` fallback itself was kept — it is still correct for
genuinely dynamic, non-UUID entity identifiers (e.g. a non-UUID id/slug segment) where
there is nothing to translate. The fix is that every *static* route segment now has a
translated key, so the fallback should no longer fire for any wired-up route. See
CLAUDE.md § "Breadcrumb Translations" for the rule going forward: new static route
segments must be added to the map + `fa.json`, never left to the fallback.

`en.json` was intentionally left untouched — the project convention is to land new
keys in `fa.json` first and translate `en.json` later (see `CLAUDE.md` § 8).

## Changes

- `apps/admin/src/components/app-breadcrumb.tsx`
- `apps/dashboard/src/components/Layout/HeaderBreadcrumb.tsx`
- `apps/admin/src/messages/fa.json`
- `apps/dashboard/src/messages/fa.json`

## Verification

`fa.json` files validated as parseable JSON. Both edited components are pure additions
to existing `switch`/map patterns (new `case`/object-entry lines calling the existing
`t()` — no new logic branches), so no test run was needed beyond that. Not
smoke-tested in a browser — no dev server was started for this change.

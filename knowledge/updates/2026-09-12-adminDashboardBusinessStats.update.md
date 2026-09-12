# Admin dashboard business stats — 2026-09-12

Backend half and full reference:
`Back/knowledge/admin/metrics/dashboardBusinessStats.doc.md` and
`Back/knowledge/updates/2026-09-12-adminDashboardBusinessStats.update.md`.
API contract row: `Back/knowledge/front-back-relations.md` (admin dashboard section).

## Problem

The admin dashboard home («آمار کلی پلتفرم») rendered only the six CQRS metric
cards. The numbers the business runs on — paid subscriptions in the selected
range, how many Instagram accounts exist versus how many are paying, and how
many commerce orders were placed — were nowhere on the page.

## Solution

A new always-visible card row, `BusinessStatsCards`, between the metric cards
and the charts. Four cards:

| Card | Number | Footer |
|---|---|---|
| «اشتراک خریداری شده» | paid subscriptions in the range | «فعال N · رزرو N · در این بازه» |
| «کل اینستاگرام‌ها» | all-time, soft-deleted excluded | «+N در این بازه» |
| «اینستاگرام فعال» | accounts holding an `active` subscription | «+N در این بازه» |
| «سفارش‌های جدید» | all-time placed orders, any status | «+N در این بازه» |

Deliberately **not** added to the metric picker or the templates: these are live
counts with no time-series behind them, so they have no chart to draw and
nothing for the chart-type / layout controls to act on. They are always shown,
like `HowFoundUsChart`.

They do follow the range control — `usePlatformBusinessStats(range)` reuses the
same `rangeParams` helper as `usePlatformSeries`, so changing the preset or
picking a custom range refetches all four.

`StatCard` is local to `business-stats-cards.tsx` rather than a shared
extraction from `MetricCard`: the two differ in the footer (a delta versus a
split) and `MetricCard` is bound to `MetricMeta`, which these cards have no
business carrying. Keeping them apart avoids widening `MetricCard`'s props for a
second caller.

## Changes

| File | Change |
|---|---|
| `apps/admin/src/hooks/use-platform-metrics.ts` | `BusinessStats` type + `usePlatformBusinessStats(range)`. |
| `apps/admin/src/app/(main)/_components/business-stats-cards.tsx` | New — `BusinessStatsCards` + local `StatCard`. |
| `apps/admin/src/app/(main)/_components/metrics-overview.tsx` | Renders the row. |
| `apps/admin/src/messages/fa.json` | Six new `Dashboard` keys: `paidSubscriptions`, `paidActive`, `paidReserved`, `totalInstagrams`, `activeInstagrams`, `commerceOrders`. |

Per CLAUDE.md §8 only `fa.json` gets the keys; `en.json` is translated later.
Numbers are formatted with the existing `Intl.NumberFormat('fa-IR')`, matching
`MetricCard`.

## Verification

- `npx tsc --noEmit` in `apps/admin` → no errors in any touched file. The
  worktree's total (143) is higher than `main`'s (124) only because the worktree
  has no `.next` build artifacts, so `.svg` module declarations and some
  generated types are missing; the extra errors are all in untouched files.
- `npx prettier --check` clean on all four files; `npx eslint` clean.
- No test runner in `apps/admin` (see memory `project_admin_frontend_tsc`), so
  no unit tests were added here — the logic under test lives in the backend
  service and is covered by its 11 new specs.

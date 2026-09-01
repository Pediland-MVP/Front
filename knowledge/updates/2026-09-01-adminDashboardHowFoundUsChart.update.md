# 2026-09-01 — Admin dashboard: howFoundUs chart

Full reference: `Back/knowledge/core/metrics/metrics.doc.md` §5.6 (paired backend change).

## Problem

No way to see the ranking of `howFoundUs` acquisition channels (telegram, instagram,
etc.) anywhere in the admin panel, despite the field having filter/detail/export
support since `feat/how-found-us`.

## Solution

New `HowFoundUsChart` — a horizontal `recharts` bar chart ranking channels by count
for the dashboard's selected date range, rendered below the existing metric cards on
`(main)/page.tsx`'s `MetricsOverview`. Labels reuse the existing
`Users.options.<value>` / `Users.howFoundUs_none` translation keys already used on
the user-detail page, so wording stays consistent app-wide.

## Changes

- `app/(main)/_components/how-found-us-chart.tsx`: new component — `Card` +
  `ChartContainer` wrapper (same structural pattern as `combined-chart.tsx`), recharts
  `BarChart layout="vertical"`.
- `hooks/use-platform-metrics.ts`: new `useHowFoundUsBreakdown(range)` hook;
  factored the inline `days`/`from`/`to` querystring logic (previously only in
  `seriesUrl`) into a shared `rangeParams()` helper, reused by both hooks.
- `app/(main)/_components/metrics-overview.tsx`: renders `<HowFoundUsChart>` always
  (not gated by the metric multi-select — it's a categorical breakdown, not one of
  the 6 selectable time-series metrics).
- `messages/fa.json`: `Dashboard.howFoundUsTitle` label.

## Verification

- `pnpm --filter admin exec tsc --noEmit`: no new errors traced to any touched file.
- No existing test coverage for this component tree (`_components/`, `hooks/` have no
  test files) — none added, matching the existing precedent for this area.
- Not visually verified in a browser (no dev-admin login available this session).

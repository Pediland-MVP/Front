// Frontend mirror of the backend MetricType enum (packages/entities/.../metricType.enum.ts).
// `key` is the i18n key under the "Dashboard" namespace; `totalsField` matches the
// PlatformTotals payload; `color` is the chart/line color.

export interface MetricMeta {
  type: number;
  key: "sessions" | "comments" | "messages" | "leads" | "leadInstagrams";
  totalsField:
    | "sessionsCount"
    | "commentsCount"
    | "messagesCount"
    | "leadsCount"
    | "leadInstagramsCount";
  color: string;
}

export const METRICS: MetricMeta[] = [
  { type: 1, key: "sessions", totalsField: "sessionsCount", color: "rgb(190 24 93)" },
  { type: 2, key: "comments", totalsField: "commentsCount", color: "rgb(37 99 235)" },
  { type: 3, key: "messages", totalsField: "messagesCount", color: "rgb(124 58 237)" },
  { type: 4, key: "leads", totalsField: "leadsCount", color: "rgb(5 150 105)" },
  { type: 5, key: "leadInstagrams", totalsField: "leadInstagramsCount", color: "rgb(217 119 6)" },
];

export const ALL_METRIC_TYPES = METRICS.map((m) => m.type);

export function metricByType(type: number): MetricMeta | undefined {
  return METRICS.find((m) => m.type === type);
}

// Time-range presets (days). Must match the backend RANGE_DAY_PRESETS allowlist.
export const RANGE_DAY_PRESETS = [1, 3, 7, 14, 30, 90, 120, 180, 365] as const;
export type RangeDays = (typeof RANGE_DAY_PRESETS)[number];
export const DEFAULT_RANGE_DAYS: RangeDays = 30;

// ---------------------------------------------------------------------------
// Customizable view model
// ---------------------------------------------------------------------------

export type ChartType = "line" | "bar" | "area";
export const CHART_TYPES: ChartType[] = ["line", "bar", "area"];

export type Layout = "grid" | "combined";
export const LAYOUTS: Layout[] = ["grid", "combined"];

/** A preset day window, or an arbitrary ISO from/to range. */
export type RangeConfig =
  | { mode: "preset"; days: RangeDays }
  | { mode: "custom"; from: string; to: string };

export interface ViewConfig {
  metrics: number[]; // selected MetricType values, subset of ALL_METRIC_TYPES
  chartType: ChartType;
  layout: Layout;
  range: RangeConfig;
}

export interface PresetView {
  id: string; // stable id, also the i18n key under Dashboard.templates
  config: ViewConfig;
}

// One-click recommended dashboards. Applying a template overwrites the whole
// ViewConfig. Order here is the order rendered in the template bar.
export const PRESET_VIEWS: PresetView[] = [
  {
    id: "all",
    config: {
      metrics: [...ALL_METRIC_TYPES],
      chartType: "line",
      layout: "grid",
      range: { mode: "preset", days: 30 },
    },
  },
  {
    id: "funnel",
    config: {
      metrics: [1, 4, 5], // sessions → leads → leadInstagrams
      chartType: "area",
      layout: "combined",
      range: { mode: "preset", days: 30 },
    },
  },
  {
    id: "engagement",
    config: {
      metrics: [2, 3], // comments, messages
      chartType: "line",
      layout: "combined",
      range: { mode: "preset", days: 14 },
    },
  },
  {
    id: "today",
    config: {
      metrics: [...ALL_METRIC_TYPES],
      chartType: "bar",
      layout: "grid",
      range: { mode: "preset", days: 1 },
    },
  },
];

export const DEFAULT_TEMPLATE_ID = "all";

function cloneConfig(config: ViewConfig): ViewConfig {
  return {
    metrics: [...config.metrics],
    chartType: config.chartType,
    layout: config.layout,
    range: { ...config.range },
  };
}

/** Fresh copy of a template's config (templates themselves stay immutable). */
export function configForTemplate(id: string): ViewConfig {
  const preset =
    PRESET_VIEWS.find((p) => p.id === id) ??
    PRESET_VIEWS.find((p) => p.id === DEFAULT_TEMPLATE_ID)!;
  return cloneConfig(preset.config);
}

export function defaultViewConfig(): ViewConfig {
  return configForTemplate(DEFAULT_TEMPLATE_ID);
}

const sameRange = (a: RangeConfig, b: RangeConfig): boolean =>
  a.mode === "preset" && b.mode === "preset"
    ? a.days === b.days
    : a.mode === "custom" && b.mode === "custom"
      ? a.from === b.from && a.to === b.to
      : false;

/** Returns the matching template id for a config, or 'custom' if it matches none. */
export function matchTemplateId(config: ViewConfig): string {
  const sorted = [...config.metrics].sort((x, y) => x - y).join(",");
  const found = PRESET_VIEWS.find(
    (p) =>
      p.config.chartType === config.chartType &&
      p.config.layout === config.layout &&
      [...p.config.metrics].sort((x, y) => x - y).join(",") === sorted &&
      sameRange(p.config.range, config.range),
  );
  return found?.id ?? "custom";
}

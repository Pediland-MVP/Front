"use client";

import { useCallback, useMemo, useState } from "react";
import {
  configForTemplate,
  defaultViewConfig,
  matchTemplateId,
  type ChartType,
  type Layout,
  type RangeConfig,
  type ViewConfig,
} from "./metrics.constants";

/**
 * In-memory dashboard view state. Not persisted — every page load starts from
 * the default template (see metrics.constants.DEFAULT_TEMPLATE_ID). Provides
 * granular setters plus `applyTemplate`, and a derived `activeTemplateId` that
 * is `'custom'` once the user tweaks away from every preset.
 */
export function useViewConfig() {
  const [config, setConfig] = useState<ViewConfig>(defaultViewConfig);

  const applyTemplate = useCallback((id: string) => {
    setConfig(configForTemplate(id));
  }, []);

  const reset = useCallback(() => {
    setConfig(defaultViewConfig());
  }, []);

  const setMetrics = useCallback((metrics: number[]) => {
    setConfig((c) => ({ ...c, metrics }));
  }, []);

  const toggleMetric = useCallback((type: number) => {
    setConfig((c) => {
      const has = c.metrics.includes(type);
      // Keep at least one metric selected.
      if (has && c.metrics.length === 1) return c;
      const metrics = has
        ? c.metrics.filter((m) => m !== type)
        : [...c.metrics, type].sort((a, b) => a - b);
      return { ...c, metrics };
    });
  }, []);

  const setChartType = useCallback((chartType: ChartType) => {
    setConfig((c) => ({ ...c, chartType }));
  }, []);

  const setLayout = useCallback((layout: Layout) => {
    setConfig((c) => ({ ...c, layout }));
  }, []);

  const setRange = useCallback((range: RangeConfig) => {
    setConfig((c) => ({ ...c, range }));
  }, []);

  const activeTemplateId = useMemo(() => matchTemplateId(config), [config]);

  return {
    config,
    activeTemplateId,
    applyTemplate,
    reset,
    setMetrics,
    toggleMetric,
    setChartType,
    setLayout,
    setRange,
  };
}

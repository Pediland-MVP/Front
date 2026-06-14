"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TemplateBar } from "./template-bar";
import { MetricMultiSelect } from "./metric-multi-select";
import { ChartTypeSelector } from "./chart-type-selector";
import { LayoutToggle } from "./layout-toggle";
import { RangeControl } from "./range-control";
import type { useViewConfig } from "./use-view-config";

type ViewConfigApi = ReturnType<typeof useViewConfig>;

export function CustomizationBar({ view }: { view: ViewConfigApi }) {
  const { config, activeTemplateId } = view;
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <TemplateBar activeId={activeTemplateId} onApply={view.applyTemplate} />
        <Separator />
        <MetricMultiSelect
          selected={config.metrics}
          onToggle={view.toggleMetric}
        />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <ChartTypeSelector
            value={config.chartType}
            onChange={view.setChartType}
          />
          <LayoutToggle value={config.layout} onChange={view.setLayout} />
        </div>
        <RangeControl value={config.range} onChange={view.setRange} />
      </CardContent>
    </Card>
  );
}

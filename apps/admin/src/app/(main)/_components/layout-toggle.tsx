"use client";

import { useTranslations } from "next-intl";
import { LayoutGrid, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LAYOUTS, type Layout } from "./metrics.constants";

const ICON_BY_LAYOUT: Record<Layout, React.ComponentType<{ className?: string }>> = {
  grid: LayoutGrid,
  combined: LineChart,
};

interface LayoutToggleProps {
  value: Layout;
  onChange: (layout: Layout) => void;
}

export function LayoutToggle({ value, onChange }: LayoutToggleProps) {
  const t = useTranslations("Dashboard");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm">{t("layoutLabel")}:</span>
      {LAYOUTS.map((layout) => {
        const Icon = ICON_BY_LAYOUT[layout];
        return (
          <Button
            key={layout}
            size="sm"
            variant={layout === value ? "default" : "outline"}
            onClick={() => onChange(layout)}
          >
            <Icon className="size-4" />
            {t(`layout.${layout}`)}
          </Button>
        );
      })}
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CHART_TYPES, type ChartType } from "./metrics.constants";

interface ChartTypeSelectorProps {
  value: ChartType;
  onChange: (type: ChartType) => void;
}

export function ChartTypeSelector({ value, onChange }: ChartTypeSelectorProps) {
  const t = useTranslations("Dashboard");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm">{t("chartTypeLabel")}:</span>
      {CHART_TYPES.map((type) => (
        <Button
          key={type}
          size="sm"
          variant={type === value ? "default" : "outline"}
          onClick={() => onChange(type)}
        >
          {t(`chartType.${type}`)}
        </Button>
      ))}
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { BarChart3, Filter, MessageCircle, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRESET_VIEWS } from "./metrics.constants";

const ICON_BY_ID: Record<string, React.ComponentType<{ className?: string }>> = {
  all: BarChart3,
  funnel: Filter,
  engagement: MessageCircle,
  today: Zap,
};

interface TemplateBarProps {
  activeId: string;
  onApply: (id: string) => void;
}

export function TemplateBar({ activeId, onApply }: TemplateBarProps) {
  const t = useTranslations("Dashboard");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm">{t("recommended")}:</span>
      {PRESET_VIEWS.map((p) => {
        const Icon = ICON_BY_ID[p.id] ?? BarChart3;
        return (
          <Button
            key={p.id}
            size="sm"
            variant={p.id === activeId ? "default" : "outline"}
            onClick={() => onApply(p.id)}
          >
            <Icon className="size-4" />
            {t(`templates.${p.id}`)}
          </Button>
        );
      })}
      {activeId === "custom" && (
        <span className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold">
          <Star className="size-3" />
          {t("customIndicator")}
        </span>
      )}
    </div>
  );
}

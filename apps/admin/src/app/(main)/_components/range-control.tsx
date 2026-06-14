"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { DateRange } from "react-day-picker";
import { CalendarRange } from "lucide-react";
import dayjs from "@/lib/dayjs-jalali";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect } from "react";
import {
  RANGE_DAY_PRESETS,
  type RangeConfig,
  type RangeDays,
} from "./metrics.constants";

interface RangeControlProps {
  value: RangeConfig;
  onChange: (range: RangeConfig) => void;
}

const fmt = (iso: string) => dayjs(iso).calendar("jalali").format("YYYY/MM/DD");

/** Start of `d` at local midnight. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function RangeControl({ value, onChange }: RangeControlProps) {
  const t = useTranslations("Dashboard");
  const [open, setOpen] = useState(false);

  const [localRange, setLocalRange] = useState<DateRange | undefined>();

  // Sync localRange with value when the popover opens.
  useEffect(() => {
    if (open) {
      if (value.mode === "custom") {
        setLocalRange({
          from: new Date(value.from),
          // value.to is exclusive (next midnight), so subtract 1ms to get the actual selected end day
          to: new Date(new Date(value.to).getTime() - 1),
        });
      } else {
        setLocalRange(undefined);
      }
    }
  }, [open, value]);

  const handleSelect = (range: DateRange | undefined) => {
    setLocalRange(range);
    if (range?.from && range?.to) {
      const from = startOfDay(range.from);
      // Make the end day inclusive: bucket < to, so push to next midnight.
      const to = new Date(startOfDay(range.to).getTime() + 24 * 60 * 60 * 1000);
      onChange({ mode: "custom", from: from.toISOString(), to: to.toISOString() });
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm">{t("rangeLabel")}:</span>
      {RANGE_DAY_PRESETS.map((days: RangeDays) => (
        <Button
          key={days}
          size="sm"
          variant={
            value.mode === "preset" && value.days === days ? "default" : "outline"
          }
          onClick={() => onChange({ mode: "preset", days })}
        >
          {t("rangeDays", { days })}
        </Button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={value.mode === "custom" ? "default" : "outline"}
          >
            <CalendarRange className="size-4" />
            {value.mode === "custom"
              ? `${fmt(value.from)} – ${fmt(value.to)}`
              : t("customRange")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto bg-white p-0">
          <Calendar
            mode="range"
            selected={localRange}
            onSelect={handleSelect}
            disabled={{ after: new Date() }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

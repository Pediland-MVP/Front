// src/components/table/filter-status.tsx
"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

// UI Imports
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, FunnelIcon } from "lucide-react";
import { statusLabels } from "@/constants/user-status";
import { stat } from "node:fs/promises";

const leadStatuses = [
  {
    value: "incoming",
    label: "جدید",
  },
  {
    value: "follow",
    label: "پیگیری",
  },
  {
    value: "force",
    label: "فوری",
  },
  {
    value: "failed",
    label: "ناموفق",
  },
];

const customerStatuses = [
  {
    value: "onboarding",
    label: statusLabels.onboarding,
  },
  {
    value: "new",
    label: statusLabels.new,
  },
  {
    value: "needed",
    label: statusLabels.needed,
  },
  {
    value: "semiActive",
    label: statusLabels.semiActive,
  },
  {
    value: "active",
    label: statusLabels.active,
  },
  {
    value: "keyUser",
    label: statusLabels.keyUser,
  },
  {
    value: "inactive",
    label: statusLabels.inactive,
  },
  {
    value: "lost",
    label: statusLabels.lost,
  },
];

const subscriptionStatuses = [
  {
    value: "active",
    label: "فعال",
  },
  {
    value: "expired",
    label: "منقضی شده",
  },
  {
    value: "cancelled",
    label: "لغو شده",
  },
  {
    value: "pending",
    label: "در انتظار",
  },
  {
    value: "reserved",
    label: "رزرو شده",
  },
  {
    value: "failed",
    label: "ناموفق",
  },
  {
    value: "pendForActivator",
    label: "اتصال",
  },
];

type FilterStatusProps = {
  type: "lead" | "customer" | "subscription";
  value?: string;
  onChange: (value: string) => void;
  size?: "default" | "sm";
};

export function FilterStatus({
  onChange,
  value = "",
  type,
  size = "default",
}: FilterStatusProps) {
  const [open, setOpen] = React.useState(false);

  const mapData =
    type === "lead"
      ? leadStatuses
      : type === "subscription"
        ? subscriptionStatuses
        : customerStatuses;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size={size}
          role="combobox"
          aria-expanded={open}
          className={cn(
            type === "lead" ? "md:w-[120px]" : "md:w-[140px]",
            "justify-between",
          )}
        >
          {value ? mapData.find((s) => s.value === value)?.label : "وضعیت"}
          <FunnelIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(type === "lead" ? "w-[120px]" : "w-[140px]", "p-0")}
      >
        <Command>
          {/* <CommandInput placeholder="جستجو..." /> */}
          <CommandList>
            <CommandEmpty>هیچ وضعیتی یافت نشد.</CommandEmpty>
            <CommandGroup>
              {mapData.map((s) => (
                <CommandItem
                  className="text-[13px]"
                  key={s.value}
                  value={s.value}
                  onSelect={(currentValue) => {
                    const nextValue =
                      currentValue === value ? "" : currentValue;
                    onChange(nextValue);
                    setOpen(false);
                  }}
                >
                  {s.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === s.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

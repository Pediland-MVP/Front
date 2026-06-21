// src/components/table/filter-label.tsx
"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

// UI Imports
import { Badge } from "@/components/ui/badge";
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
import type { LabelListItem } from "@/app/(main)/labels/types";

type FilterLabelProps = {
  value?: string;
  onChange: (value: string | undefined) => void;
  items: LabelListItem[];
  size?: "default" | "sm";
};

export function FilterLabel({
  onChange,
  value,
  items,
  size = "default",
}: FilterLabelProps) {
  const [open, setOpen] = React.useState(false);

  const selectedLabel = items.find((l) => l.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size={size}
          role="combobox"
          aria-expanded={open}
          className="justify-between md:w-[140px]"
        >
          {selectedLabel ? (
            <span className="flex items-center gap-1 truncate">
              {selectedLabel.color && (
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: selectedLabel.color }}
                />
              )}
              <span className="truncate">{selectedLabel.name}</span>
            </span>
          ) : (
            "برچسب"
          )}
          <FunnelIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>هیچ برچسبی یافت نشد.</CommandEmpty>
            <CommandGroup>
              {items.map((l) => (
                <CommandItem
                  className="text-[13px]"
                  key={l.id}
                  value={l.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? undefined : currentValue);
                    setOpen(false);
                  }}
                >
                  <span className="flex items-center gap-1 truncate">
                    {l.color && (
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: l.color }}
                      />
                    )}
                    <span className="truncate">{l.name}</span>
                  </span>
                  <Check
                    className={cn(
                      "ml-auto shrink-0",
                      value === l.id ? "opacity-100" : "opacity-0",
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

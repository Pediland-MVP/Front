// src/components/table/filter-admin.tsx
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
import { User } from "@/types/user";

type FilterAdminProps = {
  data: User[];
  onChange: (value: string) => void;
  value?: string;
  size?: "default" | "sm";
};

export function FilterAdmin({ onChange, value = "", data, size = "default" }: FilterAdminProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size={size}
          role="combobox"
          aria-expanded={open}
          className="justify-between md:w-[140px]"
        >
          {value
            ? (() => {
                const selected = data.find((s) => s.id === value);
                return selected
                  ? `${selected.firstname} ${selected.lastname}`
                  : "مسئول";
              })()
            : "مسئول"}
          <FunnelIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[140px] p-0">
        <Command>
          {/* <CommandInput placeholder="جستجو..." /> */}
          <CommandList>
            <CommandEmpty>هیچ وضعیتی یافت نشد.</CommandEmpty>
            <CommandGroup>
              {data.map((s) => (
                <CommandItem
                  className="text-xs"
                  key={s.id}
                  value={s.id}
                  onSelect={(currentValue) => {
                    const nextValue =
                      currentValue === value ? "" : currentValue;
                    onChange(nextValue);
                    setOpen(false);
                  }}
                >
                  {`${s.firstname} ${s.lastname}`}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === s.id ? "opacity-100" : "opacity-0",
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

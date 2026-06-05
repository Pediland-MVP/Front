// src/components/table/filter-category.tsx
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
import { useCategories } from "@/hooks/use-categories";
import { Category } from "@/types/category";

type FilterCategoryProps = {
  value?: string[];
  onChange: (value: string[]) => void;
  size?: "default" | "sm";
};

export function FilterCategory({ onChange, value = [], size = "default" }: FilterCategoryProps) {
  const [open, setOpen] = React.useState(false);
  const { categories } = useCategories();

  const toggleValue = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const selectedLabels = categories
    .filter((c: Category) => value.includes(c.id))
    .map((c: Category) => c.name)
    .join("، ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size={size}
          role="combobox"
          aria-expanded={open}
          className="justify-between truncate md:w-[170px]"
        >
          {value.length > 0 ? selectedLabels : "دسته‌بندی"}
          <FunnelIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[170px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>دسته‌بندی یافت نشد.</CommandEmpty>
            <CommandGroup>
              {categories.map((cat) => (
                <CommandItem
                  key={cat.id}
                  value={cat.id}
                  onSelect={() => toggleValue(cat.id)}
                >
                  {cat.name}
                  <Check
                    className={cn(
                      "mr-auto",
                      value.includes(cat.id) ? "opacity-100" : "opacity-0",
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

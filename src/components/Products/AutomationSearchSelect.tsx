"use client";

import { useDebounce } from "@/hooks/useDebounce";
import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AutomationSearchSelectProps {
  value?: string;
  onSelect: (value: string) => void;
  error?: boolean;
}

interface ConditionItem {
  id: string;
  value: string;
  // contentCycleId: string;
}

interface ConditionsResponse {
  items: ConditionItem[];
}

export function AutomationSearchSelect({
  value,
  onSelect,
  error,
}: AutomationSearchSelectProps) {
  const t = useTranslations("Products.Form.Vitrin");
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Fetch conditions when search changes
  // Note: user requested /contentCycle/conditions
  const { data, isLoading } = useSWR<ConditionsResponse>(
    debouncedSearch
      ? `/contentCycle/conditions?page=1&limit=20&search=${debouncedSearch}`
      : null,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            error && "border-red-600",
          )}
        >
          {value
            ? value // Just show the value/id for now, or we might need to fetch the label separately if it's an ID
            : t("automation")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("search_automation")}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && (
              <div className="text-muted-foreground py-6 text-center text-sm">
                Loading...
              </div>
            )}
            {!isLoading && data?.items.length === 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            <CommandGroup>
              {!isLoading &&
                data?.items?.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.value}
                    onSelect={(currentValue) => {
                      // We probably want to select the value (text) to show in the button
                      // But the prompt implies "Automation Type".
                      // If the goal is to trigger an automation by a condition keyword:
                      onSelect(item.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {item.value}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

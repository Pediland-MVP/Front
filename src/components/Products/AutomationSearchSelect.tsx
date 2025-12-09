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
  destinationContentCycleId: string;
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

  React.useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  // Fetch conditions when search changes
  // Note: user requested /contentCycle/conditions
  const { data, isLoading } = useSWR<ConditionsResponse>(
    debouncedSearch
      ? `/contentCycle/conditions?page=1&limit=20&search=${debouncedSearch}`
      : null,
  );

  const showLoading = isLoading || search !== debouncedSearch;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between border bg-white font-normal hover:bg-white",
            !value && "text-muted-foreground",
            error && "border-destructive",
          )}
        >
          {value
            ? data?.items?.find(
                (item) => item.destinationContentCycleId === value,
              )?.value || value
            : t("search_automation")}
          <ChevronsUpDown className="-ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command shouldFilter={false}>
          <CommandInput value={search} onValueChange={setSearch} />
          <CommandList>
            {showLoading && (
              <div className="text-muted-foreground py-3 text-center text-[13px]">
                {t("loading")}
              </div>
            )}
            {!showLoading && search && data?.items?.length === 0 && (
              <CommandEmpty>{t("no_results_found")}</CommandEmpty>
            )}
            <CommandGroup>
              {!showLoading &&
                search &&
                data?.items?.length > 0 &&
                data?.items?.map((item, index) => (
                  <CommandItem
                    key={`${item.id}-${index}`}
                    value={item.value}
                    className="justify-between text-[13px]"
                    onSelect={() => {
                      onSelect(item.destinationContentCycleId);
                      setOpen(false);
                    }}
                  >
                    {item.value}
                    <Check
                      className={cn(
                        "size-4",
                        value === item.destinationContentCycleId
                          ? "opacity-100"
                          : "opacity-0",
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

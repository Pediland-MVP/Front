// src/components/table/select-owners.tsx
"use client";

import { cn } from "@/lib/utils";
import { User } from "@/types/user";
import * as React from "react";

// UI Imports
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
import { Button } from "@/components/ui/button";
import { Check, CheckIcon, ChevronsUpDown } from "lucide-react";
import api from "@/hooks/swr/api-client";
import { toast } from "sonner";

export function SelectAdmins({
  type,
  kams,
  value: externalValue,
  onChange,
  itemIds,
  mutateData,
  onClearSelection,
}: {
  type: string;
  kams: User[];
  value?: string;
  onChange?: (id: string) => void;
  itemIds?: string[];
  mutateData?: () => void;
  onClearSelection?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState("");
  const value = externalValue ?? internalValue;
  const selectedKam = kams.find((kam) => kam.id === value);

  const handleSelect = (id: string) => {
    onChange?.(id);
    if (!externalValue) setInternalValue(id);
    setOpen(false);
  };

  const handleAssignAdmin = async () => {
    try {
      if (type === "lead") {
        await api.post("/marketingLeads/assignAdmin", {
          adminId: value,
          marketingLeadIds: itemIds,
        });
      }

      if (type === "customer") {
        await api.post("/users/assignAdmin", {
          adminId: value,
          userIds: itemIds,
        });
      }

      mutateData?.();
      onClearSelection?.();
      toast.success("درخواست با موفقیت انجام شد.");
    } catch (error) {
      console.error(error);
      toast.error("درخواست با خطا مواجه شد.");
    }
  };

  return (
    <div className="order-1 col-span-2 flex items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            role="combobox"
            className="flex-1 justify-between md:w-[140px]"
          >
            {selectedKam
              ? `${selectedKam.firstname} ${selectedKam.lastname}`
              : "انتخاب کنید"}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 md:w-[140px]">
          <Command>
            {/* <CommandInput placeholder="جستجو..." className="h-9" /> */}
            <CommandList>
              <CommandEmpty>نتیجه‌ای یافت نشد</CommandEmpty>
              <CommandGroup>
                {kams.map((kam) => {
                  const fullName = `${kam.firstname} ${kam.lastname}`;
                  return (
                    <CommandItem
                      key={kam.id}
                      value={kam.id}
                      onSelect={() => handleSelect(kam.id)}
                    >
                      {fullName}
                      <Check
                        className={cn(
                          "mr-auto",
                          value === kam.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        icon
        onClick={handleAssignAdmin}
      >
        <CheckIcon />
      </Button>
    </div>
  );
}

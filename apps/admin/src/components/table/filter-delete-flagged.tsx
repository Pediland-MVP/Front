// src/components/table/filter-delete-flagged.tsx
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

type FilterDeleteFlaggedProps = {
  active: boolean;
  onChange: (active: boolean) => void;
  size?: "default" | "sm";
};

export function FilterDeleteFlagged({
  active,
  onChange,
  size = "default",
}: FilterDeleteFlaggedProps) {
  return (
    <Button
      size={size}
      variant={active ? "destructive" : "outline"}
      onClick={() => onChange(!active)}
      className={cn("justify-between gap-1.5")}
    >
      <Trash2 className={cn("h-4 w-4", active ? "" : "opacity-60")} />
      حذف‌شده‌ها
    </Button>
  );
}

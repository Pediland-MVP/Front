"use client";

import * as React from "react";
import dayjs from "../../lib/dayjs-jalali";

// UI Imports
import { Button } from "./button";
import { Calendar } from "./calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function DatePicker({
  date,
  onChange,
  buttonClassName,
  popoverClassName,
}: {
  date?: Date | null;
  onChange?: (date?: Date | null) => void;
  buttonClassName?: string;
  popoverClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selectedDate?: Date) => {
    onChange?.(selectedDate);
    setOpen(false);
  };
  const formatted = date
    ? dayjs(date).calendar("jalali").format("YYYY/MM/DD")
    : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className={cn(buttonClassName || '', `data-[state=open]:border-primary data-[empty=true]:text-muted-foreground focus:border-primary flex items-center justify-start text-sm`)}
        >
          <CalendarIcon />
          {date ? formatted : <span>انتخاب تاریخ</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(popoverClassName || '', `w-auto bg-white p-0`)}>
        <Calendar
          mode="single"
          selected={date || undefined}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

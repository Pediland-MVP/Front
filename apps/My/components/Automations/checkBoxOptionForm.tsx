import { Checkbox } from "@befroosh/ui";
import React from "react";
import { Controller } from "react-hook-form";

const items = [
  { id: "if-follow", label: "ارسال پاسخ به شرط فالو داشتن صفحه" },
  { id: "like-direct", label: "پیام‌های دایرکت لایک شوند" },
];

export default function CheckBoxOptionForm({ control }: any) {
  return (
    <div>
      <div>
        {items.map((item) => (
          <Controller
            key={item.id}
            name="checkboxes"
            control={control}
            render={({ field }) => (
              <div className="flex items-center py-2 gap-2">
                <Checkbox
                  onCheckedChange={(checked) => {
                    return checked
                      ? field.onChange([...field.value, item.id])
                      : field.onChange(
                          field.value.filter((value: any) => value !== item.id)
                        );
                  }}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {item.label}
                </label>
              </div>
            )}
          />
        ))}
      </div>
    </div>
  );
}

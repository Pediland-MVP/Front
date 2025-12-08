"use client";

import { cn } from "@/lib/utils";
import { ProductFieldTypeEnum } from "@/types/product.enum";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import {
  Button,
  FormField,
  FormItem,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowsVerticalIcon } from "@phosphor-icons/react/dist/ssr";
import { Trash2Icon } from "lucide-react";
import { ButtonTypeEnum } from "@/types/buttons.enum";
import { AutomationSearchSelect } from "./AutomationSearchSelect";

export const SortableButtonItem = ({
  field,
  index,
  removeButton,
}: {
  field: any;
  index: number;
  removeButton: (id: string) => void;
}) => {
  const t = useTranslations("Products.Form.Vitrin");
  const form = useFormContext();
  const selectedType = form.watch(`buttons.${index}.type`);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: field._xid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="_item flex items-center gap-1.5"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none active:cursor-grabbing"
      >
        <ArrowsVerticalIcon size={16} className="text-gray-500" />
      </div>

      <div className="flex flex-1 gap-2">
        <FormField
          control={form.control}
          name={`buttons.${index}.type`}
          render={({ field: typeField }) => (
            <FormItem className="space-y-0">
              <Select
                value={typeField.value}
                onValueChange={typeField.onChange}
              >
                <SelectTrigger className="gap-1 pr-2 pl-1.5">
                  <SelectValue placeholder={t("button_type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={ButtonTypeEnum.TEXT}>
                      {t("text")}
                    </SelectItem>
                    <SelectItem value={ButtonTypeEnum.URL}>
                      {t("url")}
                    </SelectItem>
                    <SelectItem value={ButtonTypeEnum.AUTOMATION}>
                      {t("automation")}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {selectedType && selectedType !== ButtonTypeEnum.AUTOMATION && (
          <FormField
            control={form.control}
            name={`buttons.${index}.text`}
            render={({ field: labelField, fieldState: { error } }) => (
              <FormItem className="flex-1">
                <Input
                  placeholder={t("button_text")}
                  {...labelField}
                  className={cn(error && "border-red-600")}
                />
              </FormItem>
            )}
          />
        )}

        {selectedType === ButtonTypeEnum.URL && (
          <FormField
            control={form.control}
            name={`buttons.${index}.value`}
            render={({ field: valueField, fieldState: { error } }) => (
              <FormItem className="flex-1">
                <Input
                  placeholder={t("url")}
                  {...valueField}
                  className={cn(error && "border-red-600")}
                />
              </FormItem>
            )}
          />
        )}

        {selectedType === ButtonTypeEnum.AUTOMATION && (
          <FormField
            control={form.control}
            name={`buttons.${index}.value`}
            render={({ field: valueField, fieldState: { error } }) => (
              <FormItem className="flex-1">
                <AutomationSearchSelect
                  value={valueField.value}
                  onSelect={valueField.onChange}
                  error={!!error}
                />
              </FormItem>
            )}
          />
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => removeButton(field._xid)}
      >
        <Trash2Icon className="text-destructive" />
      </Button>
    </div>
  );
};

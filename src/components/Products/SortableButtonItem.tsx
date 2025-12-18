"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import {
  Button,
  FormControl,
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
  const selectedType = form.watch(`buttons.${index}.postbackPayloadType`);

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

      <div className="flex flex-1 flex-wrap gap-2">
        <FormField
          control={form.control}
          name={`buttons.${index}.postbackPayloadType`}
          render={({ field: typeField }) => (
            <FormItem className="w-full space-y-0 sm:w-auto">
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
                    <SelectItem value={ButtonTypeEnum.START_AUTOMATION}>
                      {t("automation")}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {selectedType && (
          <FormField
            control={form.control}
            name={`buttons.${index}.title`}
            render={({ field: labelField }) => (
              <FormItem className="w-full space-y-0 sm:flex-1">
                <FormControl>
                  <Input
                    placeholder={t("button_text")}
                    {...labelField}
                    value={labelField.value ?? ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {selectedType === ButtonTypeEnum.URL && (
          <FormField
            control={form.control}
            name={`buttons.${index}.url`}
            render={({ field: valueField }) => (
              <FormItem className="w-full space-y-0">
                <FormControl>
                  <Input
                    type="url"
                    dir="ltr"
                    placeholder={t("url")}
                    {...valueField}
                    value={valueField.value ?? ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {selectedType === ButtonTypeEnum.START_AUTOMATION && (
          <FormField
            control={form.control}
            name={`buttons.${index}.destinationContentCycleId`}
            render={({ field: valueField, fieldState: { error } }) => (
              <FormItem className="w-full space-y-0">
                <AutomationSearchSelect
                  value={valueField.value}
                  onSelect={valueField.onChange}
                  error={!!error}
                  initialData={field.destinationContentCycle}
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

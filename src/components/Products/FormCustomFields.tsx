"use client";

import { cn } from "@/lib/utils";
import { ProductFieldTypeEnum } from "@/types/product.enum";
import { useTranslations } from "next-intl";
import { useFieldArray, useFormContext } from "react-hook-form";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowsVerticalIcon,
  TextboxIcon,
} from "@phosphor-icons/react/dist/ssr";
import { CirclePlusIcon, Trash2Icon } from "lucide-react";

// Sortable item component
const SortableFieldItem = ({
  field,
  index,
  removeCustomField,
}: {
  field: any;
  index: number;
  removeCustomField: (id: string) => void;
}) => {
  const t = useTranslations("Products.Form.Product");
  const form = useFormContext();
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

      <FormField
        control={form.control}
        name={`fields.${index}.type`}
        render={({ field: typeField }) => (
          <FormItem className="space-y-0">
            <Select value={typeField.value} onValueChange={typeField.onChange}>
              <SelectTrigger className="w-auto gap-1 pr-2 pl-1.5">
                <SelectValue placeholder={t("field_type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ProductFieldTypeEnum.TEXT}>
                    {t("short_text")}
                  </SelectItem>
                  <SelectItem value={ProductFieldTypeEnum.TEXTAREA}>
                    {t("long_text")}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`fields.${index}.label`}
        render={({ field: labelField, fieldState: { error } }) => (
          <FormItem className="flex-1">
            <Input
              placeholder={t("field_title")}
              {...labelField}
              className={cn(error && "border-red-600")}
            />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`fields.${index}.isRequired`}
        render={({ field: statusField }) => (
          <FormItem className="space-y-0">
            <Select
              value={`${statusField.value}`}
              onValueChange={(value) =>
                statusField.onChange(value === "true" ? true : false)
              }
            >
              <SelectTrigger className="w-auto gap-1 pr-2 pl-1.5">
                <SelectValue placeholder={t("status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="false">{t("optional")}</SelectItem>
                  <SelectItem value="true">{t("required")}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => removeCustomField(field._xid)}
      >
        <Trash2Icon className="text-destructive" />
      </Button>
    </div>
  );
};

export const FormCustomFields = () => {
  const t = useTranslations("Products.Form.Product");
  const form = useFormContext();

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "fields",
    keyName: "_xid",
  });

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Add a new custom field
  const addCustomField = () => {
    if (fields.length < 5) {
      append({
        type: ProductFieldTypeEnum.TEXT,
        label: "",
        isRequired: false,
      });
    }
  };

  // Remove a custom field
  const removeCustomField = (_xid: string) => {
    const index = fields.findIndex((field) => field._xid === _xid);
    if (index !== -1) {
      remove(index);
    }
  };

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field._xid === active.id);
      const newIndex = fields.findIndex((field) => field._xid === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <TextboxIcon weight="duotone" /> {t("custom_fields_title")}
        </CardTitle>
        <p className="text-muted-foreground text-[13px]">
          {t("custom_fields_description")}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addCustomField}
          disabled={fields.length >= 5}
        >
          <CirclePlusIcon />
          {t("add_custom_field")}
        </Button>

        {fields.length > 0 && (
          <div className="_custom-fields space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((field) => field._xid)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field, index) => (
                  <SortableFieldItem
                    key={field._xid}
                    field={field}
                    index={index}
                    removeCustomField={removeCustomField}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

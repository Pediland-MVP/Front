"use client";
// UI Components from shadcn and custom theme
import { Input } from "@befroosh/ui";
import { FormField, FormLabel } from "@befroosh/ui";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@befroosh/ui";
import { Button } from "@befroosh/ui";
import {
  ArrowsVertical,
  PlusCircle,
  TrashSimple,
} from "@phosphor-icons/react/dist/ssr";

import { useFormContext, useFieldArray } from "react-hook-form";
import {
  DndContext,
  closestCenter,
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
import { useTranslations } from "next-intl";
import { ProductFieldTypeEnum } from "@/types/product.enum";
import { FormItem } from "@befroosh/ui";
import { cn } from "@befroosh/lib/utils";

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
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <ArrowsVertical size={16} className="text-gray-500" />
      </span>

      <FormField
        control={form.control}
        name={`fields.${index}.type`}
        render={({ field: typeField }) => (
          <Select value={typeField.value} onValueChange={typeField.onChange}>
            <SelectTrigger>
              <SelectValue placeholder="نوع فیلد" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ProductFieldTypeEnum.TEXT}>
                  متن کوتاه
                </SelectItem>
                <SelectItem value={ProductFieldTypeEnum.TEXTAREA}>
                  متن بلند
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      />

      <FormField
        control={form.control}
        name={`fields.${index}.label`}
        render={({ field: labelField, fieldState: {error} }) => (
          <FormItem>
            <Input
              
              placeholder="عنوان فیلد"
              {...labelField}
              className={cn(`w-[160px]`, error && "border-red-600")}
            />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`fields.${index}.isRequired`}
        render={({ field: statusField }) => (
          <Select
            value={`${statusField.value}`}
            onValueChange={(value) =>
              statusField.onChange(value === "true" ? true : false)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="false">اختیاری</SelectItem>
                <SelectItem value="true">اجباری</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => removeCustomField(field._xid)}
      >
        <TrashSimple size={20} />
      </Button>
    </div>
  );
};

export const ProductFields = () => {
  const form = useFormContext();

  const t = useTranslations("Products.Form");

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
    })
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
    <div className="space-y-3 bg-blue-50/50 rounded-xl border border-blue-100 p-3 xl:p-5">
      <FormLabel>{t("customFields")}</FormLabel>
      <p className="text-muted-foreground text-[13px]">
        {t("customFieldsDescription")}
      </p>
      <div className="space-y-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addCustomField}
          disabled={fields.length >= 5}
        >
          {t("addCustomField")}
          <PlusCircle className="ml-2" />
        </Button>

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
      </div>
    </div>
  );
};

export default ProductFields;

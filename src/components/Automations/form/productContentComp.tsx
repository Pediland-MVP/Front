// app/(Console)/automations/components/form/catalogue.tsx
"use client";

import { AutomationContentModeEnum } from "@/constants/automationContent.enum";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowsOutCardinalIcon,
  PlusCircleIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
} from "@phosphor-icons/react/dist/ssr";
import { GripVertical, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray, useFormContext } from "react-hook-form";
import { z } from "zod";
import { AutomationFormSchema } from "@/schemas/automationForm";
import ProductsDialog from "../products.dialog";

type ProductContentCompProps = {
  index: number;
  mode: AutomationContentModeEnum;
};

type SortableItemProps = {
  id: string;
  index: number;
  productsField: any[];
  removeProducts: (index: number) => void;
  updateProducts: (index: number, value: any) => void;
};

function SortableItem({
  id,
  index,
  productsField,
  removeProducts,
  updateProducts,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group hover:border-primary relative min-h-40 transition-all duration-200",
        isDragging && "ring-primary ring-2 ring-offset-2",
      )}
    >
      <div className="absolute top-0 right-0 z-50 mb-2 flex w-full items-center justify-between">
        <Button
          size="icon"
          variant={"link"}
          className="cursor-move touch-none text-white transition-opacity group-hover:opacity-100 lg:opacity-0"
          type="button"
          {...attributes}
          {...listeners}
        >
          <ArrowsOutCardinalIcon className="size-5" />
        </Button>

        {index !== 0 && (
          <Button
            variant="link"
            size="icon"
            className="hover:text-destructive text-white"
            type="button"
            onClick={() => removeProducts(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ProductsDialog
        index={index}
        productsField={productsField}
        updateProducts={updateProducts}
      />
    </Card>
  );
}

export default function ProductContentComp({
  index,
  mode,
}: ProductContentCompProps) {
  const t = useTranslations("Automations.Catalogue");
  const t_errors = useTranslations("Automations.Errors");

  const { control, trigger } =
    useFormContext<z.infer<typeof AutomationFormSchema>>();

  const {
    fields: productsField,
    remove: removeProducts,
    append: appendProducts,
    update: updateProducts,
    move: moveProducts,
    insert: insertProducts,
  } = useFieldArray({
    control: control,
    name: `${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${index}.products`,
    keyName: "_xid",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = productsField.findIndex(
        (item) => item._xid === active.id,
      );
      const newIndex = productsField.findIndex(
        (item) => item._xid === over?.id,
      );
      moveProducts(oldIndex, newIndex);
    }
  };

  const addProduct = () => {
    if (productsField.length < 10) {
      insertProducts(0, {});
      trigger();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col">
        <Button
          variant="outline"
          size={"sm"}
          type="button"
          onClick={addProduct}
          disabled={productsField.length >= 10}
        >
          <ShoppingBagIcon className="size-5" />
          {t("add")}
        </Button>
      </div>

      {productsField.length > 0 && (
        <div className="flex flex-col">
          {productsField.length >= 10 && (
            <p className="mb-3 text-center text-sm text-red-600">
              {t("limit")}
            </p>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={productsField.map((item) => item._xid)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-2 md:grid-cols-2 lg:grid-cols-3">
                {productsField.map((product, index) => (
                  <SortableItem
                    key={product._xid}
                    id={product._xid}
                    index={index}
                    productsField={productsField}
                    removeProducts={removeProducts}
                    updateProducts={updateProducts}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

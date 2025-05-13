"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFieldArray, useFormContext } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import ProductsDialog from "../products.dialog";
import { cn } from "@/lib/utils";
import { PlusCircle } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { ContentCycleContentModeEnum } from "@/app/constants/contentCycleContent.enum";

type CatalogueProps = {
  index: number;
  mode: ContentCycleContentModeEnum;
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
        "p-4 transition-all duration-200 group hover:border-primary",
        isDragging && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-move lg:opacity-0 group-hover:opacity-100 transition-opacity touch-none"
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        {
          index !== 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive lg:opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive/90"
            type="button"
            onClick={() => removeProducts(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          )
        }
      </div>
      <div className="flex justify-center items-center">
        <ProductsDialog
          index={index}
          productsField={productsField}
          updateProducts={updateProducts}
        />
      </div>
    </Card>
  );
}

export default function Catalogue({ index, mode }: CatalogueProps) {


  const t = useTranslations("Automations.Catalogue");
  const t_errors = useTranslations("Automations.Errors");
  
  const { control, trigger } =
    useFormContext<z.infer<typeof contentCycleFormSchema>>();

  const {
    fields: productsField,
    remove: removeProducts,
    append: appendProducts,
    update: updateProducts,
    move: moveProducts,
    insert: insertProducts
  } = useFieldArray({
    control: control,
    name: `${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? 'contents' : 'reminders'}.${index}.products`,
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
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = productsField.findIndex(
        (item) => item._xid === active.id
      );
      const newIndex = productsField.findIndex(
        (item) => item._xid === over?.id
      );
      moveProducts(oldIndex, newIndex);
    }
  };

  const addProduct = () => {
    if (productsField.length < 10) {
      insertProducts(0, {})
      trigger();
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={addProduct}
        type="button"
        className="flex items-center gap-2 cursor-pointer w-full"
        disabled={productsField.length >= 10}
      >
        <PlusCircle size={22} className="text-blue-600" />
        <span className="text-sm font-semibold text-blue-600">{t("add")}</span>
      </Button>

      {productsField.length >= 10 && (
        <p className="text-sm text-muted-foreground text-center">
          {t('limit')}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
  );
}

'use client'
import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  SortableContext,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import { PlusCircle, Trash, ArrowsOutCardinal } from "@phosphor-icons/react";
import ProductsDialog from "../products.dialog";
import {
  Control,
  useFieldArray,
  UseFormGetValues,
  UseFormStateReturn,
} from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/theme/ui/button";
import { useTranslations } from 'next-intl';

type SortableItemProps = {
  id: string;
  index: number;
  productsField: any[];
  removeProducts: (index: number) => void;
  updateProducts: (index: number, value: any) => void;
  formState: UseFormStateReturn<z.infer<typeof contentCycleFormSchema>>;
};

function SortableItem({
  id,
  index,
  productsField,
  removeProducts,
  updateProducts,
  formState
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-blue-50/50 p-3 rounded-xl flex flex-col items-start h-44"
    >
      <div className="flex items-center justify-between w-full">
        <ArrowsOutCardinal
          {...attributes}
          {...listeners}
          size={18}
          className="cursor-move"
        />
        {productsField.length > 1 && (
          <Trash
            size={20}
            className="text-red-600 cursor-pointer"
            onClick={() => removeProducts(index)}
          />
        )}
      </div>
      <div className="flex justify-center items-center h-full w-full">
        <ProductsDialog
          index={index}
          productsField={productsField}
          updateProducts={updateProducts}
          formState={formState}
        />
      </div>
    </div>
  );
}

type CatalogueProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof contentCycleFormSchema>>;
  formState: UseFormStateReturn<z.infer<typeof contentCycleFormSchema>>;
};

export default function Catalogue({
  control,
  getValues,
  formState,
}: CatalogueProps) {
  const {
    fields: productsField,
    remove: removeProducts,
    append: appendProducts,
    update: updateProducts,
    move: moveProducts,
  } = useFieldArray({
    control: control,
    name: "products",
    keyName: "_xid",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = productsField.findIndex(item => item._xid === active.id);
      const newIndex = productsField.findIndex(item => item._xid === over?.id);

      moveProducts(oldIndex, newIndex);
    }
  };

  const t = useTranslations('Automations.Catalogue')

  return (
    <>
      <FormField
        control={control}
        name="isProductsEnabled"
        render={({ field }) => {
          return (
            <FormItem className="flex flex-col justify-start gap-y-2">
              <div className="flex items-center gap-x-2">
                <FormControl>
                  <Switch
                    dir="ltr"
                    checked={!!field.value}
                    onCheckedChange={(e) => {
                      if (e) {
                        if (getValues().products?.length === 0) {
                          appendProducts({});
                        }
                      }
                      return field.onChange(e);
                    }}
                  />
                </FormControl>
                <FormLabel className="">{t('label')}</FormLabel>
              </div>
              {field.value && (
                <div className='space-y-3'>
                  <Button
                    variant="ghost"
                    onClick={() => appendProducts({})}
                    type="button"
                    className="flex items-center gap-2 cursor-pointer w-full"
                  >
                    <PlusCircle size={22} className="text-blue-600" />
                    <span className="text-sm font-semibold text-blue-600">
                      {t('add')}
                    </span>
                  </Button>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={productsField.map(item => item._xid)}
                      strategy={rectSortingStrategy}
                    >
                      <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                        style={{
                          gridTemplateRows:
                            "repeat(auto-fill, minmax(200px, 1fr))",
                        }}
                      >
                        {productsField.map((product, index) => (
                          <SortableItem
                            key={product._xid}
                            id={product._xid}
                            index={index}
                            productsField={productsField}
                            removeProducts={removeProducts}
                            updateProducts={updateProducts}
                            formState={formState}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </FormItem>
          );
        }}
      />
    </>
  );
}
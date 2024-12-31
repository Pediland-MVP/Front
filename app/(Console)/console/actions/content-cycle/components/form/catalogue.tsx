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
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import { PlusCircle, Trash, ArrowsOutCardinal } from "@phosphor-icons/react";
import ProductsDialog from "../products.dialog";
import { useFieldArray, useFormContext } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/theme/ui/button";
import { useTranslations } from "next-intl";
import ErrorMessage from "@/components/ui/errorMessage";

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
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { setValue, trigger } =
    useFormContext<z.infer<typeof contentCycleFormSchema>>();

  const deleteProduct = () => {
    removeProducts(index);
    if (index === 0) {
      setValue("isProductsEnabled", false);
      trigger();
    }
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
        {/* {getValues().products.length > 1 && ( */}
        <Trash
          size={20}
          className="text-red-600 cursor-pointer"
          onClick={deleteProduct}
        />
        {/* )} */}
      </div>
      <div className="flex justify-center items-center h-full w-full">
        <ProductsDialog
          index={index}
          productsField={productsField}
          updateProducts={updateProducts}
        />
      </div>
    </div>
  );
}

export default function Catalogue() {
  const {
    control,
    getValues,
    trigger,
    formState: { errors },
  } = useFormContext<z.infer<typeof contentCycleFormSchema>>();

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
      const oldIndex = productsField.findIndex(
        (item) => item._xid === active.id
      );
      const newIndex = productsField.findIndex(
        (item) => item._xid === over?.id
      );

      moveProducts(oldIndex, newIndex);
    }
  };

  const t = useTranslations("Automations.Catalogue");
  const t_errors = useTranslations("Automations.Errors");

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
                    type="button"
                    onCheckedChange={(isEnable) => {
                      if (isEnable) {
                        if (getValues().products?.length === 0) {
                          appendProducts({});
                        }
                      } else {
                        removeProducts(0);
                      }
                      field.onChange(isEnable);
                      trigger(); // Re-validate the form
                    }}
                  />
                </FormControl>
                <FormLabel className="">{t("label")}</FormLabel>
                {errors.isProductsEnabled && (
                <ErrorMessage>
                  {t_errors(`products.${errors.isProductsEnabled?.message}`)}
                </ErrorMessage>
              )}
              </div>
              {field.value && (
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      appendProducts({});
                      trigger(); // Re-validate the form
                    }}
                    type="button"
                    className="flex items-center gap-2 cursor-pointer w-full"
                  >
                    <PlusCircle size={22} className="text-blue-600" />
                    <span className="text-sm font-semibold text-blue-600">
                      {t("add")}
                    </span>
                  </Button>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={productsField.map((item) => item._xid)}
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
                            removeProducts={(index) => {
                              removeProducts(index);
                              trigger(); // Re-validate the form
                            }}
                            updateProducts={updateProducts}
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

// app/(Console)/automations/components/form/catalogue.tsx
"use client";

import { AutomationContentModeEnum } from "@/constants/automationContent.enum";
import { AutomationFormType } from "@/schemas/automationForm";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { ErrorMessage, ProductContentItem } from "@befroosh/ui";
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
} from "@dnd-kit/sortable";

type ProductContentProps = {
  index: number;
  mode: AutomationContentModeEnum;
};

export const ProductContentComp = ({
  index: contentIndex,
  mode,
}: ProductContentProps) => {
  const t = useTranslations("Automations.Contents.Product");
  const t_errors = useTranslations("Automations.Errors");
  const { control, trigger } = useFormContext<AutomationFormType>();

  const {
    fields: productsField,
    remove: removeProducts,
    append: appendProducts,
    update: updateProducts,
    move: moveProducts,
    insert: insertProducts,
  } = useFieldArray({
    control: control,
    name: `${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${contentIndex}.products`,
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

  useEffect(() => {
    if (productsField.length < 10) {
      const emptyProducts = productsField.filter((product) => !product.id);
      if (emptyProducts.length === 0) {
        appendProducts({});
      }
    }
  }, [productsField, appendProducts]);

  const addProduct = () => {
    if (productsField.length < 10) {
      appendProducts({});
    }
  };

  const {
    formState: { errors },
  } = useFormContext<AutomationFormType>();

  return (
    <div className="flex flex-col space-y-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-2 lg:grid-cols-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={productsField.map((item) => item._xid)}
            strategy={rectSortingStrategy}
          >
            {productsField.map((product, index) => (
              <ProductContentItem
                key={product._xid}
                id={product._xid}
                index={index}
                productsField={productsField}
                removeProducts={removeProducts}
                updateProducts={updateProducts}
                contentIndex={contentIndex}
                mode={
                  mode === AutomationContentModeEnum.AUTOMATION
                    ? "contents"
                    : "reminders"
                }
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {productsField.length === 10 && productsField.every(product => product.id) && (
        <ErrorMessage>{t("limit")}</ErrorMessage>
      )}

      {(errors as any)?.[
        mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"
      ]?.[contentIndex]?.products && (
        <ErrorMessage>{t("selection_required")}</ErrorMessage>
      )}
    </div>
  );
};

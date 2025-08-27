// src/components/Automations/form/Contents/ProductContentItem.tsx
"use client";

import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { Button, ProductContentItemDialog } from "@/components/index";
import {
  ArrowsOutCardinalIcon,
  TrashSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

type ProductContentItemProps = {
  id: string;
  index: number;
  productsField: any[];
  removeProducts: (index: number) => void;
  updateProducts: (index: number, value: any) => void;
  contentIndex: number;
  mode: string;
};

export const ProductContentItem = ({
  id,
  index,
  productsField,
  removeProducts,
  updateProducts,
  contentIndex,
  mode,
}: ProductContentItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const t = useTranslations("Automations.Contents.Product");

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group hover:border-primary relative rounded-lg border transition-all duration-200",
          isDragging && "ring-primary ring-2 ring-offset-2",
        )}
      >
        <div className="absolute top-0 right-0 z-50 flex w-full items-center justify-between">
          {productsField.length > 1 && (
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
          )}

          {productsField[index]?.id && (
            <Button
              variant="link"
              size="icon"
              className="hover:text-destructive text-white"
              type="button"
              onClick={() => removeProducts(index)}
            >
              <TrashSimpleIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="relative aspect-square">
          {productsField[index]?.id ? (
            <>
              <Image
                src={productsField[index]?.images?.[0]?.url}
                alt={t("cover_image_alt")}
                width={250}
                height={0}
                className="aspect-square rounded-lg object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30 opacity-0 duration-150 group-hover:opacity-100">
                <Button type="button" size="sm" onClick={() => setIsOpen(true)}>
                  {t("change")}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-gray-300">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsOpen(true)}
              >
                {t("select")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <ProductContentItemDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        index={index}
        productsField={productsField}
        updateProducts={updateProducts}
      />
    </>
  );
};

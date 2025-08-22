// app/(Console)/automations/components/form/buttonTemplateItem.tsx
"use client";

import { ContentCycleContentModeEnum } from "@/constants/contentCycleContent.enum";
import { useI18nZodErrors } from "@/lib/useI18nZodErrors";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../../contentCycle";

// UI Imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ErrorMessage } from "@/components/index";
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowsOutCardinalIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";

type ContentButtonsItemProps = {
  id: string;
  index: number;
  contentIndex: number;
  remove: (index: number) => void;
  mode: ContentCycleContentModeEnum;
};

export const ContentButtonsItem = ({
  id,
  index,
  contentIndex,
  remove,
  mode,
}: ContentButtonsItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  useI18nZodErrors();
  const { control } = useFormContext<z.infer<typeof contentCycleFormSchema>>();
  const t = useTranslations("Automations.ButtonTemplates");
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group hover:border-primary w-full p-4 transition-all duration-200",
        isDragging && "ring-primary ring-2 ring-offset-2",
      )}
    >
      <div className="mb-2 flex w-full items-center justify-between">
        <Button
          variant="link"
          size="icon"
          className="size-5! cursor-move touch-none p-0"
          type="button"
          {...attributes}
          {...listeners}
        >
          <ArrowsOutCardinalIcon className="text-gray-500" />
        </Button>
        {index !== 0 && (
          <Button
            variant="link"
            size="icon"
            className="text-destructive size-5! p-0"
            type="button"
            onClick={() => remove(index)}
          >
            <TrashIcon />
          </Button>
        )}
      </div>
      <div className="flex flex-col items-center justify-center gap-y-2">
        <FormField
          control={control}
          name={`${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${contentIndex}.buttonTemplate.buttons.${index}.title`}
          render={({ field, fieldState: { error } }) => (
            <FormItem className="w-full">
              <FormLabel>
                {t("title.label")}{" "}
                {index + 1 === 1 ? "اول" : index + 1 === 2 ? "دوم" : "سوم"}
              </FormLabel>
              <Input
                {...field}
                className="w-full"
                placeholder={t("title.placeholder")}
              />
              <FormDescription>{t("title.description")}</FormDescription>
              {error && <ErrorMessage>{error.message}</ErrorMessage>}
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${contentIndex}.buttonTemplate.buttons.${index}.url`}
          render={({ field, fieldState: { error } }) => (
            <FormItem className="w-full">
              <FormLabel>{t("url.label")}</FormLabel>
              <Input
                {...field}
                className="w-full"
                placeholder={t("url.placeholder")}
              />
              <FormDescription>{t("url.description")}</FormDescription>
              {error && <ErrorMessage>{error.message}</ErrorMessage>}
            </FormItem>
          )}
        />
      </div>
    </Card>
  );
};

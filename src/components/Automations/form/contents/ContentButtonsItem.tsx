// src/components/Automations/form/Contents/ContentButtonsItem.tsx
"use client";

import { AutomationContentModeEnum } from "@/constants/automationContent.enum";
import { useI18nZodErrors } from "@/lib/useI18nZodErrors";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { z } from "zod";
import { AutomationFormSchema } from "@/schemas/automationForm";

// UI Imports
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  ErrorMessage,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  Input,
} from "@/components/index";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowsOutCardinalIcon,
  TrashSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";

type ContentButtonsItemProps = {
  id: string;
  index: number;
  contentIndex: number;
  remove: (index: number) => void;
  mode: AutomationContentModeEnum;
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
  const { control } = useFormContext<z.infer<typeof AutomationFormSchema>>();
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
        "group relative w-full gap-2 transition-all duration-200",
        index !== 0 && "pt-4",
        isDragging && "ring-primary ring-1",
      )}
    >
      {index !== 0 && (
        <CardHeader className="gap-0">
          <div className="flex items-center justify-between">
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

            <Button
              variant="link"
              size="icon"
              className="text-destructive size-5! p-0"
              type="button"
              onClick={() => remove(index)}
            >
              <TrashSimpleIcon />
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name={`${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${contentIndex}.buttonTemplate.buttons.${index}.title`}
          render={({ field, fieldState: { error } }) => (
            <FormItem>
              <FormLabel>
                {t("title.label")}{" "}
                {index + 1 === 1 ? "اول" : index + 1 === 2 ? "دوم" : "سوم"}
              </FormLabel>
              <Input {...field} placeholder={t("title.placeholder")} />
              <FormDescription>{t("title.description")}</FormDescription>
              {error && <ErrorMessage>{error.message}</ErrorMessage>}
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${contentIndex}.buttonTemplate.buttons.${index}.url`}
          render={({ field, fieldState: { error } }) => (
            <FormItem>
              <FormLabel>{t("url.label")}</FormLabel>
              <Input {...field} placeholder={t("url.placeholder")} />
              <FormDescription>{t("url.description")}</FormDescription>
              {error && <ErrorMessage>{error.message}</ErrorMessage>}
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Input } from "@/components/theme/ui/input";
import { FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { contentCycleFormSchema } from "../../contentCycle";
import { z } from "zod";
import { ContentCycleContentModeEnum } from "@/app/constants/contentCycleContent.enum";
import { useTranslations } from "next-intl";
import { DotsSixVertical, Trash } from "@phosphor-icons/react/dist/ssr";
import ErrorMessage from "@/components/ui/errorMessage";
import { useI18nZodErrors } from "@/lib/useI18nZodErrors";

type ButtonTemplateItemProps = {
  id: string;
  index: number;
  contentIndex: number;
  remove: (index: number) => void;
  mode: ContentCycleContentModeEnum;
};

export default function ButtonTemplateItem({
  id,
  index,
  contentIndex,
  remove,
  mode,
}: ButtonTemplateItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  useI18nZodErrors()

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
        "p-4 transition-all duration-200 group hover:border-primary w-full",
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
          <DotsSixVertical className="h-4 w-4" />
        </Button>
        {index !== 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive lg:opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive/90"
            type="button"
            onClick={() => remove(index)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-y-2 justify-center items-center">

      <FormField
          control={control}
          name={`${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${contentIndex}.buttonTemplate.buttons.${index}.title`}
          render={({ field, fieldState: {error} }) => (
            <FormItem className="w-full">
              <FormLabel>
                {t('title.label')}
              </FormLabel>
              <Input {...field} className="w-full" placeholder={t("title.placeholder")} />
              <FormDescription>{t("title.description")}</FormDescription>
              {error && <ErrorMessage>{error.message}</ErrorMessage>}
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${contentIndex}.buttonTemplate.buttons.${index}.url`}
          render={({ field, fieldState: {error} }) => (
            <FormItem className="w-full">
              <FormLabel>
                {t('url.label')}
              </FormLabel>
              <Input {...field} className="w-full" placeholder={t("url.placeholder")} />
              <FormDescription>{t("url.description")}</FormDescription>
              {error && <ErrorMessage>{error.message}</ErrorMessage>}
            </FormItem>
          )}
        />
      </div>
    </Card>
  );
}

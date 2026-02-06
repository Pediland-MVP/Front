"use client";

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from "@/constants/automationContent.enum";
import { cn } from "@/lib/utils";
import { AutomationFormType } from "@/schemas/automationForm";
import { ButtonTypeEnum } from "@/types/buttons.enum";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

import { AutomationSearchSelect } from "@/components/Products/AutomationSearchSelect";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  FormField,
  FormItem,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { ErrorMessage } from "@/components/ui-custom/ErrorMessage";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { MoveVerticalIcon, TrashIcon } from "lucide-react";
import { AutomationButtonsContentTypes } from "./AutomationButtons";

type ButtonContentItemProps = {
  id: string;
  index: number;
  contentIndex: number;
  remove: (index: number) => void;
  mode: AutomationContentModeEnum;
  contentType: AutomationButtonsContentTypes;
};

const contentTypePayloadType: Record<
  | 'buttonTemplate'
  | AutomationContentTypesEnum.QUESTION
  | AutomationContentTypesEnum.TEXT,
  Partial<Record<ButtonTypeEnum, boolean>>
> = {
  text: {
    text: true,
    CONSENT: true,
    startAutomation: true,
  },
  buttonTemplate: {
    text: true,
    url: true,
    startAutomation: true,
  },
  question: {
    text: true
  },
};

export const ButtonContentItem = ({
  id,
  index,
  contentIndex,
  remove,
  mode,
  contentType,
}: ButtonContentItemProps) => {
  const form = useFormContext<AutomationFormType>();
  const selectedType = form.watch(
    `${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${contentIndex}.${contentType === "buttonTemplate" ? "buttonTemplate.buttons" : "quickReplies"}.${index}.postbackPayloadType`,
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const t = useTranslations("Automations.Contents.Button");
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative w-full gap-0 transition-all duration-200",
        isDragging && "z-10",
      )}
    >
      <Card
        className={cn(
          "w-full gap-0 p-3",
          index !== 0 && "pt-4",
          isDragging && "ring-primary ring-1",
        )}
      >
        <CardHeader className="-mt-2 p-0">
          <div className="flex items-center justify-between">
            {index !== 0 ? (
              <Button
                variant="link"
                size="icon"
                className="size-5! cursor-move touch-none p-0"
                type="button"
                {...attributes}
                {...listeners}
              >
                <MoveVerticalIcon className="text-gray-400" />
              </Button>
            ) : (
              // To use justify-between
              <div></div>
            )}
            <Button
              variant="link"
              size="icon"
              className="text-destructive size-5! p-0"
              type="button"
              onClick={() => remove(index)}
            >
              <TrashIcon />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 p-0">
          <FormField
            control={form.control}
            name={`${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${contentIndex}.${contentType === "buttonTemplate" ? "buttonTemplate.buttons" : "quickReplies"}.${index}.postbackPayloadType`}
            render={({ field: typeField }) => (
              <FormItem className="w-full space-y-0 sm:w-auto">
                <Select
                  value={typeField.value ?? ""}
                  onValueChange={typeField.onChange}
                >
                  <SelectTrigger className="gap-1 pr-2 pl-1.5">
                    <SelectValue placeholder={t("button_type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {Object.values(ButtonTypeEnum).map((buttonType) => {
                        return (
                          contentTypePayloadType[contentType][buttonType] ? <SelectItem key={buttonType} value={buttonType}>{t(`${buttonType}.label`)}</SelectItem> : null
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          {selectedType && (
            <FormField
              control={form.control}
              name={`${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${contentIndex}.${contentType === "buttonTemplate" ? "buttonTemplate.buttons" : "quickReplies"}.${index}.title`}
              render={({ field, fieldState: { error } }) => (
                <FormItem className="flex w-full flex-1">
                  <div className="w-full space-y-1">
                    <Input
                      {...field}
                      aria-invalid={!!error}
                      placeholder={t(`${selectedType}.placeholder`)}
                    />
                    {error && <ErrorMessage>{error.message}</ErrorMessage>}
                  </div>
                </FormItem>
              )}
            />
          )}

          {selectedType === ButtonTypeEnum.URL && (
            <FormField
              control={form.control}
              name={`${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${contentIndex}.buttonTemplate.buttons.${index}.url`}
              render={({ field, fieldState: { error } }) => (
                <FormItem className="w-full">
                  <Input
                    type="url"
                    dir="ltr"
                    className="text-left"
                    {...field}
                    value={field.value ?? ""}
                    aria-invalid={!!error}
                    placeholder={t("url.placeholder")}
                  />
                  {error && <ErrorMessage>{error.message}</ErrorMessage>}
                </FormItem>
              )}
            />
          )}

          {selectedType === ButtonTypeEnum.START_AUTOMATION && (
            <FormField
              control={form.control}
              name={`${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${contentIndex}.${contentType === "buttonTemplate" ? "buttonTemplate.buttons" : "quickReplies"}.${index}.destinationContentCycleId`}
              render={({ field: valueField, fieldState: { error } }) => (
                <FormItem className="w-full space-y-0">
                  <AutomationSearchSelect
                    value={valueField.value}
                    onSelect={valueField.onChange}
                    error={!!error}
                    initialData={form.getValues(
                      `${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${contentIndex}.${contentType === "buttonTemplate" ? "buttonTemplate.buttons" : "quickReplies"}.${index}.destinationContentCycle`,
                    )}
                  />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

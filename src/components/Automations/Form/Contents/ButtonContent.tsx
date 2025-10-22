// src/components/Automations/Form/Contents/ButtonContent.tsx
"use client";

import { AutomationContentModeEnum } from "@/constants/automationContent.enum";
import { AutomationFormType } from "@/schemas/automationForm";
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
import { useTranslations } from "next-intl";
import { useFieldArray, useFormContext } from "react-hook-form";

import {
  Button,
  ButtonContentItem,
  ErrorMessage,
  FormField,
  FormItem,
  FormLabel,
  InputCounter,
  Textarea,
} from "@components";
import { RadioButtonIcon } from "@phosphor-icons/react/dist/ssr";

type ButtonContentProps = {
  mode: AutomationContentModeEnum;
  contentIndex: number;
};

export const ButtonContent = ({ contentIndex, mode }: ButtonContentProps) => {
  const t = useTranslations("Automations.Contents.Button");
  const t_err = useTranslations("Automations.Contents.Button.Errors");

  const {
    control,
    trigger,
    clearErrors,
    formState: { errors },
    watch,
  } = useFormContext<AutomationFormType>();

  // NOTE: I dindt changed default name of fields becuase it was not working :)
  const { fields, move, remove, append } = useFieldArray({
    control: control,
    name: `${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${contentIndex}.buttonTemplate.buttons`,
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
      const oldIndex = fields.findIndex((item) => item._xid === active.id);
      const newIndex = fields.findIndex((item) => item._xid === over?.id);
      move(oldIndex, newIndex);
    }
  };

  const addButton = () => {
    if (fields.length <= 10) {
      append({
        title: "",
        url: "",
      });
    }
  };

  return (
    <div className="flex flex-col gap-y-3">
      <FormField
        control={control}
        name={`${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${contentIndex}.buttonTemplate.text`}
        render={({ field, fieldState: { error } }) => (
          <FormItem>
            <FormLabel>{t("text.label")}</FormLabel>
            <Textarea
              {...field}
              maxLength={640}
              aria-invalid={!!error}
              placeholder={t("text.placeholder")}
            />
            <InputCounter text={field.value} maxLength={640} />
            {error && <ErrorMessage>{t_err("required")}</ErrorMessage>}
          </FormItem>
        )}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((item) => item._xid)}
          strategy={rectSortingStrategy}
        >
          <div className="flex w-full flex-col items-center justify-center gap-y-3">
            {fields.map((buttonTemplate, index) => (
              <ButtonContentItem
                key={buttonTemplate._xid}
                id={buttonTemplate._xid}
                index={index}
                contentIndex={contentIndex}
                remove={remove}
                mode={mode}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {fields.length < 3 && (
        <Button
          type="button"
          variant="outline"
          size={"sm"}
          onClick={addButton}
          disabled={fields.length >= 10}
        >
          <RadioButtonIcon className="size-5" />
          {t("add")}
        </Button>
      )}
    </div>
  );
};

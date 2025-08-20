// app/(Console)/automations/components/form/buttonTemplateComp.tsx

import { ContentCycleContentModeEnum } from "@/app/constants/contentCycleContent.enum";
import { Button } from "@/components/ui/button";
import InputCounter from "@/components/ui/inputCounter";
import { Textarea } from "@/components/ui/textarea";
import ErrorMessage from "@/components/ui/errorMessage";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
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
import { RadioButtonIcon } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { useFieldArray, useFormContext } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import ButtonTemplateItem from "./buttonTemplateItem";

type ButtonTemplateCompProps = {
  mode: ContentCycleContentModeEnum;
  contentIndex: number;
};

export default function ButtonTemplateComp({
  contentIndex,
  mode,
}: ButtonTemplateCompProps) {
  const t = useTranslations("Automations.ButtonTemplates");
  const t_errors = useTranslations("Automations.Errors");

  const {
    control,
    trigger,
    clearErrors,
    formState: { errors },
    watch,
  } = useFormContext<z.infer<typeof contentCycleFormSchema>>();

  // NOTE: I dindt changed default name of fields becuase it was not working :)
  const { fields, move, remove, append } = useFieldArray({
    control: control,
    name: `${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${contentIndex}.buttonTemplate.buttons`,
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
        name={`${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${contentIndex}.buttonTemplate.text`}
        render={({ field, fieldState: { error } }) => (
          <FormItem className="w-full">
            <FormLabel>{t("text.label")}</FormLabel>
            <Textarea
              {...field}
              maxLength={640}
              rows={3}
              className="w-full"
              placeholder={t("text.placeholder")}
            />
            <InputCounter text={field.value} maxLength={640} />
            {error && <ErrorMessage>{error.message}</ErrorMessage>}
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
              <ButtonTemplateItem
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
}

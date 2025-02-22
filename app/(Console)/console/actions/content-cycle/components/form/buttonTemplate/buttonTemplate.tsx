import { ContentCycleContentModeEnum } from "@/app/constants/contentCycleContent.enum";
import { useFieldArray, useFormContext } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../../contentCycle";
import { useTranslations } from "next-intl";
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
} from "@dnd-kit/sortable";
import ButtonTemplateItem from "./buttonTemplateItem";
import { Button } from "@/components/theme/ui/button";
import { PlusCircle } from "@phosphor-icons/react/dist/ssr";
import ErrorMessage from "@/components/ui/errorMessage";
import {
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/theme/ui/input";

type ButtonTemplateProps = {
  mode: ContentCycleContentModeEnum;
  contentIndex: number;
};
export default function ButtonTemplate({
  contentIndex,
  mode,
}: ButtonTemplateProps) {
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
    })
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
    <div className="w-full flex flex-col gap-y-4">
      <FormField
        control={control}
        name={`${mode === ContentCycleContentModeEnum.CONTENT_CYCLE ? "contents" : "reminders"}.${contentIndex}.buttonTemplate.text`}
        render={({ field, fieldState: { error } }) => (
          <FormItem className="w-full">
            <FormLabel>{t("text.label")}</FormLabel>
            <Input
              {...field}
              className="w-full"
              placeholder={t("text.placeholder")}
            />
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
          <div className="w-full flex flex-col gap-y-2 justify-center items-center">
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
          variant="ghost"
          onClick={addButton}
          type="button"
          className="flex items-center gap-2 cursor-pointer w-full"
          disabled={fields.length >= 10}
        >
          <PlusCircle size={22} className="text-blue-600" />
          <span className="text-sm font-semibold text-blue-600">
            {t("add")}
          </span>
        </Button>
      )}
    </div>
  );
}

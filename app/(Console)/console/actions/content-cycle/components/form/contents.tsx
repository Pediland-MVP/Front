"use client";

import { useTranslations } from "next-intl";
import {
  Control, useFieldArray,
  useFormContext,
  UseFormGetValues,
  UseFormStateReturn
} from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";

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
  SortableContext
} from "@dnd-kit/sortable";
// Just UI Imports Below
import { Button } from "@/components/theme/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import {
  PlusCircle
} from "@phosphor-icons/react/dist/ssr";
import { Switch } from "@/components/ui/switch";
import ErrorMessage from "@/components/ui/errorMessage";
import ContentItem from "./contentItem";

type ContentsProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof contentCycleFormSchema>>;
  formState: UseFormStateReturn<z.infer<typeof contentCycleFormSchema>>;
};

// Sortable Item Component
export default function Contents({
  control,
  getValues,
  formState,
}: ContentsProps) {
  const t = useTranslations("Automations.Contents");
  const t_errors = useTranslations("Automations.Errors");
  const {
    fields: contentsField,
    remove: removeContents,
    append: appendContents,
    update: updateContents,
    move: moveContents,
  } = useFieldArray({
    control: control,
    name: "contents",
    keyName: "_xid",
  });

  const { setValue, trigger } =
    useFormContext<z.infer<typeof contentCycleFormSchema>>();

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = contentsField.findIndex(
        (field) => field._xid === active.id
      );
      const newIndex = contentsField.findIndex(
        (field) => field._xid === over?.id
      );

      moveContents(oldIndex, newIndex);
    }
  };

  const addContent = (isEnabled: boolean) => {
    {
      if (isEnabled) {
        if (getValues().contents?.length === 0) {
          appendContents({
            text: "",
            haveConsent: false,
          });
        }
      } else {
        removeContents(0);
      }
      setValue("isContentsEnabled", isEnabled);
      trigger();
    }
  };

  return (
    <>
      <FormField
        control={control}
        name="isContentsEnabled"
        render={({ field, fieldState: { error } }) => {
          return (
            <FormItem className="flex flex-col justify-start gap-y-2">
              <div className="flex items-center gap-x-2">
                <FormControl>
                  <Switch
                    type="button"
                    dir="ltr"
                    checked={!!field.value}
                    onCheckedChange={addContent}
                  />
                </FormControl>
                <FormLabel className="">{t("label")}</FormLabel>
                {error?.message === "at_least" && (
                  <ErrorMessage>
                    {t_errors(`contents.${error?.message}`)}
                  </ErrorMessage>
                )}
              </div>
              {field.value && (
                <div className="space-y-3">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={contentsField.map((field) => field._xid)}
                      strategy={rectSortingStrategy}
                    >
                      {contentsField.length > 0 && (
                        <div className="space-y-3">
                          {contentsField.map((content, index) => (
                            <ContentItem
                              key={content._xid}
                              id={content._xid}
                              index={index}
                              contentsField={contentsField}
                              removeContents={removeContents}
                              updateContents={updateContents}
                            />
                          ))}
                        </div>
                      )}
                    </SortableContext>
                  </DndContext>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      appendContents({
                        text: "",
                        // instagramPost: { mediaId: "" },
                        // consentText: "",
                        haveConsent: false,
                      })
                    }
                    type="button"
                    className="flex items-center gap-2 cursor-pointer w-full"
                  >
                    <PlusCircle size={22} className="text-blue-600" />
                    <span className="text-sm font-semibold text-blue-600">
                      {t("addContent")}
                    </span>
                  </Button>
                </div>
              )}
              {formState.errors.contents?.message === "at_least" && (
                <ErrorMessage>
                  {t_errors(`contents.${formState.errors.contents.message}`)}
                </ErrorMessage>
              )}
            </FormItem>
          );
        }}
      />
    </>
  );
}

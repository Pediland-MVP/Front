"use client";

import { useTranslations } from "next-intl";
import {
  Control,
  Controller,
  useFieldArray,
  useFormContext,
  UseFormGetValues,
  UseFormStateReturn,
} from "react-hook-form";
import InstagramPostsDialog from "../../../components/instagramPosts.dialog";
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
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
// Just UI Imports Below
import { Button } from "@/components/theme/ui/button";
import { Textarea } from "@/components/theme/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  PlusCircle,
  Trash,
  ArrowsOutCardinal,
} from "@phosphor-icons/react/dist/ssr";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import ErrorMessage from "@/components/ui/errorMessage";

type ContentsProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof contentCycleFormSchema>>;
  formState: UseFormStateReturn<z.infer<typeof contentCycleFormSchema>>;
};

// Sortable Item Component
function SortableItem({
  id,
  index,
  contentsField,
  removeContents,
  updateContents,
}: {
  id: string;
  index: number;
  contentsField: any[];
  removeContents: (index: number) => void;
  updateContents: (index: number, value: any) => void;
}) {

  const { control, setValue, trigger } = useFormContext<z.infer<typeof contentCycleFormSchema>>()

  const t = useTranslations("Automations.Contents");
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const deleteContent = () => {
    removeContents(index);
    if (index === 0) {
      setValue('isContentsEnabled', false);
    }
    trigger()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-blue-50 p-3 rounded-xl flex flex-col items-start"
    >
      <div className="_header flex justify-between items-center w-full">
        <div {...attributes} {...listeners} className="cursor-move">
          <ArrowsOutCardinal size={20} />
        </div>
        <div>
          <Trash
            size={22}
            className="text-red-600 cursor-pointer"
            onClick={deleteContent}
            aria-label={t("removeContent")}
          />
        </div>
      </div>

      <div className="_content gap-3 flex flex-col w-full">
        <div className="relative flex justify-center items-center">
          <InstagramPostsDialog
            index={index}
            updateContents={updateContents}
            contents={contentsField}
          />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Controller
            name={`contents.${index}.text`}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <Textarea placeholder={t("enterYourMessage")} {...field} />
                {error && <FormMessage> {error.message} </FormMessage>}
              </FormItem>
            )}
          />

          <FormField
            name={`contents.${index}.haveConsent`}
            control={control}
            render={({ field }) => (
              <FormItem className="flex flex-col justify-start gap-y-2">
                <div className="flex items-center gap-x-2">
                  <FormControl>
                    <Checkbox
                      dir="ltr"
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="">{t("consent")}</FormLabel>
                </div>
                {!!field.value && (
                  <Controller
                    name={`contents.${index}.consentText`}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <FormItem>
                        <Textarea
                          placeholder={t("consentMessage")}
                          {...field}
                        />
                        {error && <FormMessage> {error.message} </FormMessage>}
                      </FormItem>
                    )}
                  />
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}

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

  const { setValue, trigger } = useFormContext<z.infer<typeof contentCycleFormSchema>>()

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

  const addContent = (isEnabled: boolean) => { {
      if (isEnabled) {
        if (getValues().contents?.length === 0) {
          appendContents({
            text: "",
            haveConsent: false,
          });
        }
      } else {
        removeContents(0)
      }
      setValue('isContentsEnabled', isEnabled)
      trigger()
    } 
  }

  return (
    <>
      <FormField
        control={control}
        name="isContentsEnabled"
        render={({ field, fieldState: {error} }) => {
          return (
            <FormItem className="flex flex-col justify-start gap-y-2">
              <div className="flex items-center gap-x-2">
                <FormControl>
                  <Switch
                    dir="ltr"
                    checked={!!field.value}
                    onCheckedChange={addContent}
                  />
                </FormControl>
                <FormLabel className="">{t("label")}</FormLabel>
                {error?.message === 'at_least' && (
                <ErrorMessage>
                  {t_errors(`contents.${error?.message}`)}
                </ErrorMessage>
              )}
              </div>
              {field.value && (
                <div className="space-y-3">
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
                            <SortableItem
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
                </div>
              )}
              {formState.errors.contents?.message === 'at_least' && (
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

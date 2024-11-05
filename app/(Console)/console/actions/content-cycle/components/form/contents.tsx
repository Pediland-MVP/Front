"use client";

import { FormItem, FormMessage } from "@/components/ui/form";
import { PlusCircle, Trash, ArrowsOutCardinal } from "@phosphor-icons/react";
import {
  Control,
  Controller,
  useFieldArray,
  UseFormGetValues,
  UseFormStateReturn,
} from "react-hook-form";
import InstagramPostsDialog from "../../../components/instagramPosts.dialog";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

type ContentsProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof contentCycleFormSchema>>;
  formState: UseFormStateReturn<z.infer<typeof contentCycleFormSchema>>;
};

// Sortable Item Component
function SortableItem({
  id,
  index,
  control,
  getValues,
  formState,
  contentsField,
  removeContents,
  updateContents,
}: {
  id: string;
  index: number;
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  getValues: UseFormGetValues<z.infer<typeof contentCycleFormSchema>>;
  formState: UseFormStateReturn<z.infer<typeof contentCycleFormSchema>>;
  contentsField: any[];
  removeContents: (index: number) => void;
  updateContents: (index: number, value: any) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="space-y-4 border-[1.2px] p-2 rounded-2xl flex gap-x-4 items-start"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-move pt-2 flex flex-col gap-y-2 justify-center items-center"
      >
        <ArrowsOutCardinal size={20} />
      </div>
      <div className="relative flex justify-center items-center w-48">
        <InstagramPostsDialog
          index={index}
          updateContents={updateContents}
          formState={formState}
          getValues={getValues}
          contents={contentsField}
        />
      </div>
      <div className="flex flex-col gap-2 w-full">
        <Trash
          size={24}
          className="text-red-600 cursor-pointer "
          onClick={() => removeContents(index)}
        />
        <Controller
          name={`contents.${index}.text`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <FormItem>
              <Textarea
                className="w-full border px-3 py-2 rounded-xl"
                placeholder="پیام خود را وارد کنید"
                {...field}
              />
              {error && <FormMessage> {error.message} </FormMessage>}
            </FormItem>
          )}
        />

        <Controller
          name={`contents.${index}.consentText`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <FormItem>
              <Textarea
                className="w-full border px-3 py-2 rounded-xl"
                placeholder="پیام کسب اجازه: آیا مایل به ادامه هستید؟..."
                {...field}
              />
              {error && <FormMessage> {error.message} </FormMessage>}
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export default function Contents({
  control,
  getValues,
  formState,
}: ContentsProps) {
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

  return (
    <>
      <Button
        variant="ghost"
        onClick={() =>
          appendContents({
            text: "",
            instagramPost: { mediaId: "" },
            consentText: "",
          })
        }
        type="button"
        className="flex items-center gap-2 cursor-pointer"
      >
        <PlusCircle size={24} />
        <span className="text-sm font-semibold text-blue-600">
          افزودن محتوا
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
          <div className="space-y-4">
            {contentsField.map((content, index) => (
              <SortableItem
                key={content._xid}
                id={content._xid}
                index={index}
                control={control}
                getValues={getValues}
                formState={formState}
                contentsField={contentsField}
                removeContents={removeContents}
                updateContents={updateContents}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}

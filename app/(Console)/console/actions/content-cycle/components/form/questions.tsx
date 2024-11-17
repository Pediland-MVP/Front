"use client";
import { FormField } from "@/components/ui/form";
import { PlusCircle, ArrowsOutCardinal } from "@phosphor-icons/react";
import { Control, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "../contentCycle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Trash } from "@phosphor-icons/react/dist/ssr";

type QuestionsProps = {
  control: Control<z.infer<typeof contentCycleFormSchema>>;
};

// Sortable Item Component
function SortableItem({
  id,
  index,
  control,
  removeQuestions,
}: {
  id: string;
  index: number;
  control: Control<z.infer<typeof contentCycleFormSchema>>;
  removeQuestions: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-x-4 items-center">
      <div {...attributes} {...listeners} className="cursor-move">
        <ArrowsOutCardinal size={20} />
      </div>
      <Trash
        size={24}
        className="text-red-600 cursor-pointer "
        onClick={() => removeQuestions(index)}
      />
      <FormField
        control={control}
        name={`questions.${index}.text`}
        render={({ field }) => (
          <Input {...field} placeholder="سوال" className="flex-grow" />
        )}
      />
    </div>
  );
}

export default function Questions({ control }: QuestionsProps) {
  const {
    fields: questionsField,
    remove: removeQuestions,
    append: appendQuestions,
    update: updateQuestions,
    move: moveQuestions,
    swap: swapQuestions,
  } = useFieldArray({
    control: control,
    name: "questions",
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
      const oldIndex = questionsField.findIndex(
        (field) => field._xid === active.id
      );
      const newIndex = questionsField.findIndex(
        (field) => field._xid === over?.id
      );

      // Use arrayMove to reorder the fields
      moveQuestions(oldIndex, newIndex);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        onClick={() =>
          appendQuestions({
            text: "",
          })
        }
        type="button"
        className="flex items-center gap-2 cursor-pointer"
      >
        <PlusCircle size={24} />
        <span className="text-sm font-semibold text-blue-600">افزودن سوال</span>
      </Button>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questionsField.map((field) => field._xid)}
          strategy={rectSortingStrategy}
        >
          <div className="space-y-2">
            {questionsField.map((question, index) => (
              <SortableItem
                removeQuestions={removeQuestions}
                key={question._xid}
                id={question._xid}
                index={index}
                control={control}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}

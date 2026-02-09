// src/components/Automations/Form/Contents/ButtonContent.tsx
"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { AutomationContentModeEnum } from "@/constants/automationContent.enum";
import { AutomationFormType } from "@/schemas/automationForm";
import { ButtonTypeEnum } from "@/types/buttons.enum";
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

import { Button } from "@/components/ui";
import { RadioButtonIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonContentItem } from "./ContentButtonsItem";
import React, { SetStateAction, useEffect } from "react";
import { AppendQuestionButtonType } from "./QuestionContent";

export type AutomationButtonsContentTypes = 'text' | 'buttonTemplate' | 'question';

type ButtonContentProps = {
  contentType: AutomationButtonsContentTypes;
  mode: AutomationContentModeEnum;
  contentIndex: number,
};


const MaximumButtonLength = {
    text: 13,
    buttonTemplate: 3,
    question: 13
}

export const AutomationButtons = ({ contentIndex, contentType, mode }: ButtonContentProps) => {
  const t = useTranslations("Automations.Contents.Button");
  const maximumButtonLength: number = MaximumButtonLength[contentType]

  const { control } = useFormContext<AutomationFormType>();

  // NOTE: I dindt changed default name of fields becuase it was not working :)
  const { fields, move, remove, append } = useFieldArray({
    control: control,
    name: `${mode === AutomationContentModeEnum.AUTOMATION ? "contents" : "reminders"}.${contentIndex}.${contentType === 'text' || contentType === 'question' ? 'quickReplies' : 'buttonTemplate.buttons'}`,
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
      const oldIndex = fields.findIndex((item) => item.id === active.id);
      const newIndex = fields.findIndex((item) => item.id === over?.id);
      move(oldIndex, newIndex);
    }
  };

  const addButton = () => {
    if (fields.length <= maximumButtonLength) {
      append({
        postbackPayloadType: ButtonTypeEnum.TEXT,
        title: "",
      });
    }
  };

  return (
    <div className="flex flex-col gap-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((item) => item.id)}
          strategy={rectSortingStrategy}
        >
          <div className="flex w-full flex-col items-center justify-center gap-y-3">
            {fields.map((buttonTemplate, index) => (
              <ButtonContentItem
                key={buttonTemplate.id}
                id={buttonTemplate.id}
                index={index}
                contentIndex={contentIndex}
                remove={remove}
                mode={mode}
                contentType={contentType}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {fields.length < maximumButtonLength && (
        <Button
          type="button"
          variant="outline"
          size={"sm"}
          onClick={addButton}
          disabled={fields.length >= maximumButtonLength}
        >
          <RadioButtonIcon className="size-5" />
          {t("add")}
        </Button>
      )}
    </div>
  );
};

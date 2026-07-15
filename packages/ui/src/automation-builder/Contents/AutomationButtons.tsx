// src/components/Automations/Form/Contents/ButtonContent.tsx
'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { AutomationContentModeEnum } from '../constants/automationContent.enum';
import { AutomationFormType } from '../schemas/automationForm';
import { ButtonTypeEnum } from '../types/buttons.enum';
import { AutomationBuilderApiClient } from '../types/apiClient';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui';
import { RadioButtonIcon } from '@phosphor-icons/react/dist/ssr';
import { ButtonContentItem } from './ContentButtonsItem';
import React, { useEffect } from 'react';

export type AutomationButtonsContentTypes = 'text' | 'buttonTemplate' | 'question' | 'vitrin';

type ButtonContentProps = {
  contentType: AutomationButtonsContentTypes;
  mode: AutomationContentModeEnum;
  contentIndex: number;
  /** وقتی داخل Vitrin یا ساختارهای nested هستیم از این override استفاده می‌شود */
  fieldNameOverride?: string;
  apiClient: AutomationBuilderApiClient;
};

const MaximumButtonLength = {
  text: 13,
  buttonTemplate: 3,
  question: 13,
  vitrin: 3,
};

export const AutomationButtons = ({
  contentIndex,
  contentType,
  mode,
  fieldNameOverride,
  apiClient,
}: ButtonContentProps) => {
  const t = useTranslations('Automations.Contents.Button');
  const maximumButtonLength: number = MaximumButtonLength[contentType];

  const { control } = useFormContext<AutomationFormType>();

  type DefaultFieldNameType =
    `${'contents' | 'reminders'}.${number}.${'buttonTemplate.buttons' | 'quickReplies' | 'buttons'}`;
  const defaultFieldName: DefaultFieldNameType = `${mode === AutomationContentModeEnum.AUTOMATION ? 'contents' : 'reminders'}.${contentIndex}.${contentType === 'text' || contentType === 'question' ? 'quickReplies' : contentType === 'vitrin' ? 'buttons' : 'buttonTemplate.buttons'}`;

  const { fields, move, remove, append } = useFieldArray({
    control,
    name: (fieldNameOverride ?? defaultFieldName) as any,
    keyName: '_xid', // ← هماهنگ با VitrinContent
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((item: any) => item._xid === active.id);
      const newIndex = fields.findIndex((item: any) => item._xid === over?.id);
      move(oldIndex, newIndex);
    }
  };

  const addButton = () => {
    if (fields.length < maximumButtonLength) {
      append({
        title: '',
        ...(contentType === 'question' && { postbackPayloadType: ButtonTypeEnum.TEXT }),
      });
    }
  };

  return (
    <div className="_AutomationButtons flex flex-col gap-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={fields.map((item: any) => item._xid)}
          strategy={rectSortingStrategy}
        >
          <div className="flex w-full flex-col items-center justify-center gap-y-3">
            {fields.map((button, index) => {
              return (
                <ButtonContentItem
                  key={button._xid}
                  id={button._xid}
                  index={index}
                  contentIndex={contentIndex}
                  remove={remove}
                  mode={mode}
                  contentType={contentType}
                  fieldNameOverride={fieldNameOverride}
                  apiClient={apiClient}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {fields.length < maximumButtonLength && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addButton}
          disabled={fields.length >= maximumButtonLength}
        >
          <RadioButtonIcon className="size-5" />
          {t('add')}
        </Button>
      )}
    </div>
  );
};

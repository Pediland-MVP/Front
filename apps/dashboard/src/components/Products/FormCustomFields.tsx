'use client';

import { ProductFieldTypeEnum } from '@/types/product.enum';
import { useTranslations } from 'next-intl';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TextboxIcon } from '@phosphor-icons/react/dist/ssr';
import { CirclePlusIcon } from 'lucide-react';
import { SortableFieldItem } from './SortableFieldItem';

export const FormCustomFields = () => {
  const t = useTranslations('Products.Form.Product');
  const form = useFormContext();

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'fields',
    keyName: '_xid',
  });

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Add a new custom field
  const addCustomField = () => {
    if (fields.length < 5) {
      append({
        type: ProductFieldTypeEnum.TEXT,
        label: '',
        isRequired: false,
      });
    }
  };

  // Remove a custom field
  const removeCustomField = (_xid: string) => {
    const index = fields.findIndex((field) => field._xid === _xid);
    if (index !== -1) {
      remove(index);
    }
  };

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field._xid === active.id);
      const newIndex = fields.findIndex((field) => field._xid === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <TextboxIcon weight="duotone" /> {t('custom_fields_title')}
        </CardTitle>
        <CardDescription>{t('custom_fields_description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addCustomField}
          disabled={fields.length >= 5}
        >
          <CirclePlusIcon />
          {t('add_custom_field')}
        </Button>

        {fields.length > 0 && (
          <div className="_custom-fields space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((field) => field._xid)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field, index) => (
                  <SortableFieldItem
                    key={field._xid}
                    field={field}
                    index={index}
                    removeCustomField={removeCustomField}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Consolidated error message for all fields */}
            {form.formState.errors['fields'] && (
              <p className="text-destructive text-[13px] font-medium">{t('fields_error')}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

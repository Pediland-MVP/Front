import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { DresserIcon } from '@phosphor-icons/react/dist/ssr/Dresser';
import { ButtonTypeEnum } from '@/types/buttons.enum';
import { CirclePlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { SortableButtonItem } from './SortableButtonItem';
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

export const FormVitrinButtons = () => {
  const t = useTranslations('Products.Form.Vitrin');
  const form = useFormContext();

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'buttons',
    keyName: '_xid',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const addButton = () => {
    if (fields.length < 3) {
      append({
        postbackPayloadType: ButtonTypeEnum.TEXT,
        title: '',
        url: '',
        destinationContentCycleId: null, // explicit null to avoid undefined/ID issues
      });
    }
  };

  const removeButton = (_xid: string) => {
    const index = fields.findIndex((field) => field._xid === _xid);
    if (index !== -1) {
      remove(index);
    }
  };

  // Check if there are any button errors (root or nested)
  const hasButtonErrors = () => {
    const buttonErrors = form.formState.errors['buttons'];
    if (!buttonErrors) return false;

    // Check for root-level error (e.g., min length)
    if (buttonErrors.message) return true;

    // Check for nested errors (e.g., buttons[0].title)
    if (Array.isArray(buttonErrors)) {
      return buttonErrors.some((btn) => btn && Object.keys(btn).length > 0);
    }

    return false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <DresserIcon weight="duotone" /> دکمه ها
        </CardTitle>
        <CardDescription>{t('buttons_description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addButton}
          disabled={fields.length >= 3}
        >
          <CirclePlusIcon />
          {t('add_button')}
        </Button>

        {fields.length > 0 && (
          <div className="_buttons space-y-6 sm:space-y-3">
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
                  <SortableButtonItem
                    key={field._xid}
                    field={field}
                    index={index}
                    removeButton={removeButton}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}

        {hasButtonErrors() && (
          <p className="text-destructive text-[13px] font-medium">
            {typeof form.formState.errors['buttons']?.message === 'string'
              ? form.formState.errors['buttons'].message
              : t('buttons_error')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

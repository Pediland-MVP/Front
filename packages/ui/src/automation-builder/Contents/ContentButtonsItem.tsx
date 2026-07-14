'use client';

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from '../constants/automationContent.enum';
import { cn } from '@/lib/utils';
import { AutomationFormType } from '../schemas/automationForm';
import { ButtonTypeEnum } from '../types/buttons.enum';
import { useTranslations } from 'next-intl';
import { Control, useFormContext, useWatch } from 'react-hook-form';

import { AutomationSearchSelect } from './AutomationSearchSelect';
import { AutomationBuilderApiClient } from '../types/apiClient';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { MoveVerticalIcon, TrashIcon } from 'lucide-react';
import { AutomationButtonsContentTypes } from './AutomationButtons';

type ButtonContentItemProps = {
  id: string;
  index: number;
  contentIndex: number;
  remove: (index: number) => void;
  mode: AutomationContentModeEnum;
  contentType: AutomationButtonsContentTypes;
  fieldNameOverride?: string;
  control: Control<AutomationFormType>;
  apiClient: AutomationBuilderApiClient;
};

const contentTypePayloadType: Record<
  | 'buttonTemplate'
  | AutomationContentTypesEnum.QUESTION
  | AutomationContentTypesEnum.TEXT
  | AutomationContentTypesEnum.VITRIN,
  Partial<Record<ButtonTypeEnum, boolean>>
> = {
  text: {
    startAutomation: true,
    text: true,
    CONSENT: true,
  },
  buttonTemplate: {
    startAutomation: true,
    text: true,
    url: true,
  },
  question: {
    text: true,
  },
  vitrin: {
    startAutomation: true,
    text: true,
    url: true,
  },
};

export const ButtonContentItem = ({
  id,
  index,
  contentIndex,
  remove,
  mode,
  contentType,
  fieldNameOverride,
  control,
  apiClient,
}: ButtonContentItemProps) => {
  const form = useFormContext<AutomationFormType>();

  // ── محاسبه مسیر پویا (اینجا فیکس اصلی است) ──
  type DefaultFieldNameType =
    `${'contents' | 'reminders'}.${number}.${'buttonTemplate.buttons' | 'quickReplies' | 'buttons'}`;
  const defaultFieldName: DefaultFieldNameType = `${mode === AutomationContentModeEnum.AUTOMATION ? 'contents' : 'reminders'}.${contentIndex}.${contentType === 'text' || contentType === 'question' ? 'quickReplies' : contentType === 'vitrin' ? 'buttons' : 'buttonTemplate.buttons'}`;
  const fieldPath = fieldNameOverride ?? defaultFieldName;

  console.log('FieldPath on ButtonContentItem', fieldPath);

  const selectedType = useWatch({
    name: `${fieldPath}.${index}.postbackPayloadType` as any,
    control,
  });

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const t = useTranslations('Automations.Contents.Button');
  const t_ec = useTranslations('Automations.Contents.Button.Errors');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative w-full gap-0 transition-all duration-200',
        isDragging && 'z-10',
      )}
    >
      <Card
        className={cn(
          'w-full gap-0 p-3',
          index !== 0 && 'pt-4',
          isDragging && 'ring-primary ring-1',
        )}
      >
        <CardHeader className="-mt-2 p-0">
          <div className="flex items-center justify-between">
            {index !== 0 ? (
              <Button
                variant="link"
                size="icon"
                className="size-5! cursor-move touch-none p-0"
                type="button"
                {...attributes}
                {...listeners}
              >
                <MoveVerticalIcon className="text-gray-400" />
              </Button>
            ) : (
              <div></div>
            )}

            {!(contentType === 'question' && index === 0) && (
              <Button
                variant="link"
                size="icon"
                className="text-destructive size-5! p-0"
                type="button"
                onClick={() => remove(index)}
              >
                <TrashIcon />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-wrap gap-2 p-0">
          {/* نوع دکمه */}
          <FormField
            control={form.control}
            name={`${fieldPath}.${index}.postbackPayloadType` as any}
            render={({ field: typeField, fieldState: { error } }) => (
              <FormItem className="w-full space-y-0 sm:w-auto">
                {Object.keys(contentTypePayloadType[contentType]).length > 1 && (
                  <Select value={typeField.value ?? ''} onValueChange={typeField.onChange}>
                    <SelectTrigger className="gap-1 pr-2 pl-1.5">
                      <SelectValue placeholder={t('button_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.values(ButtonTypeEnum).map((buttonType) => {
                          return contentTypePayloadType[contentType][buttonType] ? (
                            <SelectItem key={buttonType} value={buttonType}>
                              {t(`${buttonType}.label`)}
                            </SelectItem>
                          ) : null;
                        })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
                {error && (
                  <ErrorMessage className="mt-1">{t_ec('buttonTypeRequired')}</ErrorMessage>
                )}
              </FormItem>
            )}
          />

          {/* عنوان دکمه */}
          {selectedType && (
            <FormField
              control={form.control}
              name={`${fieldPath}.${index}.title` as any}
              render={({ field, fieldState: { error } }) => (
                <FormItem className="flex w-full flex-1">
                  <div className="w-full space-y-1">
                    <Input
                      {...field}
                      aria-invalid={!!error}
                      placeholder={t(`${selectedType}.placeholder`)}
                    />
                    {error && <ErrorMessage>{error.message}</ErrorMessage>}
                  </div>
                </FormItem>
              )}
            />
          )}

          {/* URL (فقط وقتی نوع URL انتخاب شده) */}
          {selectedType === ButtonTypeEnum.URL && (
            <FormField
              control={form.control}
              name={`${fieldPath}.${index}.url` as any}
              render={({ field, fieldState: { error } }) => (
                <FormItem className="w-full">
                  <Input
                    type="url"
                    dir="ltr"
                    className="text-left"
                    {...field}
                    value={field.value ?? ''}
                    aria-invalid={!!error}
                    placeholder={t('url.placeholder')}
                  />
                  {error && <ErrorMessage>{error.message}</ErrorMessage>}
                </FormItem>
              )}
            />
          )}

          {/* انتخاب اتوماسیون (فقط وقتی نوع START_AUTOMATION انتخاب شده) */}
          {selectedType === ButtonTypeEnum.START_AUTOMATION && (
            <FormField
              control={form.control}
              name={`${fieldPath}.${index}.destinationContentCycleId` as any}
              render={({ field: valueField, fieldState: { error } }) => (
                <FormItem className="w-full space-y-0">
                  <AutomationSearchSelect
                    apiClient={apiClient}
                    value={valueField.value}
                    onSelect={(id, label) => {
                      valueField.onChange(id);
                      form.setValue(
                        `${fieldPath}.${index}.destinationContentCycleTitle` as any,
                        label,
                      );
                    }}
                    error={!!error}
                    initialData={form.getValues(
                      `${fieldPath}.${index}.destinationContentCycle` as any,
                    )}
                    title={form.getValues(
                      `${fieldPath}.${index}.destinationContentCycleTitle` as any,
                    )}
                  />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

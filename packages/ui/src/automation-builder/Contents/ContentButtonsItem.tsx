'use client';

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from '../constants/automationContent.enum';
import { cn } from '@/lib/utils';
import { AutomationFormType } from '../schemas/automationForm';
import { ButtonTypeEnum } from '../types/buttons.enum';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Control, useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { AutomationSearchSelect } from './AutomationSearchSelect';
import { useContentsContext } from './ContentsContext';
import { AutomationBuilderApiClient } from '../types/apiClient';
import { InstagramPostSelectDialog } from '../Form/InstagramPostSelectDialog';
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
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr';
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

const buttonTemplateTypeOrder: ButtonTypeEnum[] = [
  ButtonTypeEnum.URL,
  ButtonTypeEnum.START_AUTOMATION,
  ButtonTypeEnum.INSTAGRAM_POST,
  ButtonTypeEnum.TEXT,
];

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
    instagram_post: true,
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
  const { builderMode } = useContentsContext();

  const t = useTranslations('Automations.Contents.Button');
  const t_ec = useTranslations('Automations.Contents.Button.Errors');
  const t_post = useTranslations('Automations.InstagramPostSelectDialog');
  const t_guard = useTranslations('Automations.TargetPostComment.Errors');

  // Templates (admin builder) can't offer a "start automation" button or an "Instagram
  // Post" button: there is no workspace automation to target, and no fixed Instagram
  // account to fetch posts from. Hide both from the type picker in template mode.
  const isButtonTypeAllowed = (buttonType: ButtonTypeEnum) =>
    !!contentTypePayloadType[contentType][buttonType] &&
    !(
      builderMode === 'template' &&
      (buttonType === ButtonTypeEnum.START_AUTOMATION ||
        buttonType === ButtonTypeEnum.INSTAGRAM_POST)
    );

  // ── محاسبه مسیر پویا (اینجا فیکس اصلی است) ──
  type DefaultFieldNameType =
    `${'contents' | 'reminders'}.${number}.${'buttonTemplate.buttons' | 'quickReplies' | 'buttons'}`;
  const defaultFieldName: DefaultFieldNameType = `${mode === AutomationContentModeEnum.AUTOMATION ? 'contents' : 'reminders'}.${contentIndex}.${contentType === 'text' || contentType === 'question' ? 'quickReplies' : contentType === 'vitrin' ? 'buttons' : 'buttonTemplate.buttons'}`;
  const fieldPath = fieldNameOverride ?? defaultFieldName;

  const postbackPayloadType = useWatch({
    name: `${fieldPath}.${index}.postbackPayloadType` as any,
    control,
  });

  // The saved form only ever stores `postbackPayloadType: 'url'` for both the plain URL
  // button and the "Instagram Post" button (the latter is a URL button under the hood —
  // see docs/superpowers/specs/2026-07-17-instagram-post-button-design.md). They can't be
  // told apart from the form value alone, so which one the dropdown *displays* is tracked
  // separately, seeded once from the saved value. Reopening a saved automation always
  // shows a previously-post-picked button as a plain URL button — that's expected.
  const [uiButtonType, setUiButtonType] = useState<ButtonTypeEnum | ''>(postbackPayloadType ?? '');
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);

  const typeSelectHandler = (value: ButtonTypeEnum) => {
    setUiButtonType(value);
    form.setValue(
      `${fieldPath}.${index}.postbackPayloadType` as any,
      value === ButtonTypeEnum.INSTAGRAM_POST ? ButtonTypeEnum.URL : value,
      { shouldValidate: true },
    );
  };

  const openPostPickerHandler = () => {
    const instagramIds = form.getValues('instagramIds') ?? [];
    if (instagramIds.length > 1) {
      toast.error(t_guard('specific_post_requires_single_instagram'));
      return;
    }
    setIsPostDialogOpen(true);
  };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

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
            render={({ fieldState: { error } }) => (
              <FormItem className="w-full space-y-0 sm:w-auto">
                {Object.values(ButtonTypeEnum).filter(isButtonTypeAllowed).length > 1 && (
                  <Select value={uiButtonType || ''} onValueChange={typeSelectHandler}>
                    <SelectTrigger className="gap-1 pr-2 pl-1.5">
                      <SelectValue placeholder={t('button_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {(contentType === 'buttonTemplate'
                          ? buttonTemplateTypeOrder
                          : Object.values(ButtonTypeEnum)
                        ).map((buttonType) => {
                          return isButtonTypeAllowed(buttonType) ? (
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
          {uiButtonType && (
            <FormField
              control={form.control}
              name={`${fieldPath}.${index}.title` as any}
              render={({ field, fieldState: { error } }) => (
                <FormItem className="flex w-full flex-1">
                  <div className="w-full space-y-1">
                    <Input
                      {...field}
                      maxLength={35}
                      aria-invalid={!!error}
                      placeholder={t(`${uiButtonType}.placeholder`)}
                    />
                    {error && <ErrorMessage>{error.message}</ErrorMessage>}
                  </div>
                </FormItem>
              )}
            />
          )}

          {/* URL (وقتی نوع URL یا پست اینستاگرام انتخاب شده) */}
          {(uiButtonType === ButtonTypeEnum.URL ||
            uiButtonType === ButtonTypeEnum.INSTAGRAM_POST) && (
            <FormField
              control={form.control}
              name={`${fieldPath}.${index}.url` as any}
              render={({ field, fieldState: { error } }) => {
                const isInstagramPost = uiButtonType === ButtonTypeEnum.INSTAGRAM_POST;
                const hasSelectedPost = isInstagramPost && !!field.value;
                const showPickerOnly = isInstagramPost && !hasSelectedPost;

                return (
                  <FormItem className="w-full">
                    <div className="flex items-center gap-1">
                      {!showPickerOnly && (
                        <Input
                          type="url"
                          dir="ltr"
                          className="text-left"
                          {...field}
                          value={field.value ?? ''}
                          aria-invalid={!!error}
                          placeholder={
                            isInstagramPost ? t('instagram_post.placeholder') : t('url.placeholder')
                          }
                        />
                      )}
                      {isInstagramPost && (
                        <Button
                          type="button"
                          variant="outline"
                          size={showPickerOnly ? 'default' : 'icon'}
                          className={showPickerOnly ? 'w-full' : 'shrink-0'}
                          aria-label={t_post('select_post')}
                          onClick={openPostPickerHandler}
                        >
                          <InstagramLogoIcon />
                          {showPickerOnly && t_post('select_post')}
                        </Button>
                      )}
                    </div>
                    {error && <ErrorMessage>{error.message}</ErrorMessage>}
                    {isInstagramPost && (
                      <InstagramPostSelectDialog
                        index={index}
                        mode={mode}
                        apiClient={apiClient}
                        open={isPostDialogOpen}
                        onOpenChange={setIsPostDialogOpen}
                        onSelect={(post) => {
                          field.onChange(post.permalink ?? '');
                          setIsPostDialogOpen(false);
                        }}
                      />
                    )}
                  </FormItem>
                );
              }}
            />
          )}

          {/* انتخاب اتوماسیون (فقط وقتی نوع START_AUTOMATION انتخاب شده) */}
          {uiButtonType === ButtonTypeEnum.START_AUTOMATION && (
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

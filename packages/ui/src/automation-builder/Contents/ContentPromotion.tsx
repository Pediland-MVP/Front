'use client';

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from '../constants/automationContent.enum';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
// TODO: Refactor Types & Schemas
import { AutomationFormType } from '../schemas/automationForm';

import {
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui';
import { TrashSimpleIcon } from '@phosphor-icons/react/dist/ssr/TrashSimple';
import { ContentPromotionDialog } from './ContentPromotionDialog';

export const ContentPromotion = () => {
  const t = useTranslations('Automations.Contents');
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);

  const {
    control,
    getValues,
    formState: { errors },
    setValue,
    clearErrors,
    trigger,
  } = useFormContext<AutomationFormType>();

  //   let { removeContents, updateContents, contents } = useContentsContext();
  const contents: any[] = [];
  const updateContents = (...res: any[]) => {};
  const removeContents = (...res: any[]) => {};
  const index = 1;
  const id = 1_000_000;
  const mode = AutomationContentModeEnum.AUTOMATION;

  const deleteContent = () => {
    removeContents(index);

    // if the index is 1, set the haveConsent to false because for consent we need at least 2 item
    if (index === 1) {
      updateContents(0, {
        ...(mode === AutomationContentModeEnum.AUTOMATION
          ? getValues().contents?.[0]
          : getValues().reminders?.[0]),
        haveConsent: false,
      });
    }
    trigger();
  };

  const handleMessageTypeChange = async (type: AutomationContentTypesEnum | 'media') => {
    // Create a new content object with the selected type
    //NOTE: Default values of the new content
    const updatedContent = {
      ...contents[index],
      type,
      // Reset content-specific fields when changing type
      ...((type === AutomationContentTypesEnum.TEXT ||
        type === AutomationContentTypesEnum.INSTAGRAM_POST) && {
        file: null,
      }),
      ...(type === AutomationContentTypesEnum.PRODUCT && {
        products: [{}],
      }),
      ...(type === AutomationContentTypesEnum.BUTTON_TEMPLATE
        ? {
            buttonTemplate: {
              text: '',
              buttons: [
                {
                  url: '',
                  text: '',
                },
              ],
            },
          }
        : {
            buttonTemplate: null,
          }),
      ...(type !== AutomationContentTypesEnum.TEXT && { text: undefined }),
    };

    // Update the form field
    updateContents(index, updatedContent);

    // Trigger form validation
    await trigger(
      `${mode === AutomationContentModeEnum.AUTOMATION ? 'contents' : 'reminders'}.${index}`,
    );

    clearErrors('contents.0.buttonTemplate');
  };

  return (
    <>
      <div className="flex flex-col items-start gap-y-3 rounded-xl border border-dashed border-violet-200/75 bg-violet-50/60 p-3 hover:border-violet-300">
        <div className="_header flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Label className="text-primary leading-4">{t('promotion_announcement')}</Label>
          </div>

          <div>
            <TrashSimpleIcon
              size={20}
              className="cursor-pointer text-red-600"
              onClick={() => setSubscriptionDialogOpen(true)}
              aria-label={t('remove_content')}
            />
          </div>
        </div>

        <div className="_content flex w-full flex-col">
          <ContentPromotionDialog
            setIsOpen={setSubscriptionDialogOpen}
            isOpen={subscriptionDialogOpen}
          />

          <div className="flex w-full flex-col gap-2">
            <FormItem>
              <Textarea disabled value={t('promotion_text')} className="text-[13px]" rows={3} />
            </FormItem>

            {contents?.[index]?.type === AutomationContentTypesEnum.TEXT &&
              mode === AutomationContentModeEnum.AUTOMATION &&
              (contents.length > 1 || index > 0) &&
              index !== contents.length - 1 && (
                <FormField
                  name={`contents.${index}.haveConsent`}
                  control={control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-start gap-y-2">
                      <div className="flex items-center gap-x-2">
                        <FormControl>
                          <TooltipProvider>
                            <Tooltip
                              {...(contents.length > 1 &&
                                contents?.[index]?.type === AutomationContentTypesEnum.TEXT && {
                                  open: false,
                                })}
                            >
                              <TooltipTrigger
                                asChild
                                disabled={
                                  contents.length > 1 ||
                                  contents?.[index]?.type !== AutomationContentTypesEnum.TEXT
                                }
                              >
                                <Checkbox
                                  disabled={
                                    contents.length <= 1 ||
                                    contents?.[index]?.type !== AutomationContentTypesEnum.TEXT
                                  }
                                  dir="ltr"
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                {contents.length <= 1
                                  ? t('consentTooltip')
                                  : contents?.[index]?.type !== AutomationContentTypesEnum.TEXT &&
                                    t('consentTooltipType')}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormControl>
                        <FormLabel className="">{t('consent')}</FormLabel>
                      </div>
                      {!!field.value && (
                        <Controller
                          name={`contents.${index}.consentText`}
                          control={control}
                          render={({ field, fieldState: { error } }) => (
                            <FormItem>
                              <Input placeholder={t('consent_message')} {...field} />
                              {error && <FormMessage> {error.message} </FormMessage>}
                            </FormItem>
                          )}
                        />
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
          </div>
        </div>
      </div>
    </>
  );
};

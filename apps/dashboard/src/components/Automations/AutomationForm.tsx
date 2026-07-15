'use client';

import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from '@/constants/automationContent.enum';
import { ButtonTypeEnum } from '@/types/buttons.enum';
import api, { fetcher } from '@/hooks/swr/api-client';
import { useAutomationDefaults } from '@/hooks/useAutomationDefaults';
import { useI18nZodErrors } from '@/hooks/useI18nZodErrors';
import useUser from '@/hooks/useUser';
import { cn } from '@/lib/utils';
import { AutomationFormSchema, type AutomationFormType } from '@/schemas/automationForm';
import type { ExceptionMessage } from '@/types/exceptionMessage';
import type { IResponseMessage } from '@/types/responseMessage';
import { InstagramNamespace } from '@/types/instagram';
import { mutateIncludeStringKey } from '@/utils/mutateIncludeStringKey';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';

import { Button, Form } from '@/components/ui';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { SeperateLine } from '@/components/ui-custom/SeperateLine';
import { ConnectInstagramAlert } from './ConnectInstagramAlert';
import { FreeQuotaWarningDialog } from './FreeQuotaWarningDialog';
import {
  CommentReplies,
  Conditions,
  ConditionTypesEnum,
  Contents,
  InstagramSelectField,
  JustFollowers,
  Reminder,
  TargetPostComment,
  TitleAndEnabled,
  Triggers,
} from './Form';
import { ValidationTypeEnum } from '@/types/validationType.enum';
import { CommentLimitAlert } from './Form/CommentLimitAlert';
import { useInstagramFilterStore } from '@/lib/stores/useInstagramFilterStore';

type AutomationFormProps = {
  id?: string;
  copyFromId?: string;
};

/**
 *
 * @param {id} Object This param is optional and specify the component is for Update or Create`
 * @returns
 */
export const AutomationForm = ({ id, copyFromId }: AutomationFormProps) => {
  useI18nZodErrors();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { hasInstagram, isLoading } = useUser();
  const t = useTranslations('Automations');
  const t_ec = useTranslations('ERROR_CODES');
  const t_err = useTranslations('Automations.Errors');
  const { selectedIds: filterSelectedIds } = useInstagramFilterStore();

  const isUUID = (s?: string) =>
    !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

  const sourceId = id ?? copyFromId;
  const key = isUUID(sourceId) ? `/contentCycle/${sourceId}` : null;

  const {
    data: automation,
    isLoading: isAutomationLoading,
    error: automationError,
    mutate: automationMutate,
  } = useSWRImmutable(key, {
    revalidateOnMount: !!sourceId,
  });

  // Same SWR key InstagramSelectField uses — dedupes, no extra request. Carries each
  // page's `automationCount` (live) + `freeAutomationLimit`, used below to warn before
  // the automation that would push a page over its free quota.
  const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
  const { data: accountsResponse } = useSWRImmutable<
    IResponseMessage<InstagramNamespace.Account[]>
  >(`${API_URL}/instagram/accounts`, fetcher, { revalidateOnMount: true });
  const accounts = accountsResponse?.data;

  const [pendingSubmitValues, setPendingSubmitValues] = useState<AutomationFormType | null>(null);
  const [freeQuotaWarning, setFreeQuotaWarning] = useState<{
    usedCount: number;
    limit: number;
  } | null>(null);

  /**
   * Only meaningful for a brand-new automation (`id` unset) on a page that hasn't
   * crossed its free quota yet — once `freeAutomationQuotaExceeded` is already true,
   * adding another automation doesn't change anything, so no warning is shown. Checked
   * against `freeAutomationQuotaExceeded`, not `isPromotion` — a page can be over quota
   * but not promoted if it has active subscription coverage, and this warning is
   * specifically about the free-quota boundary, not the (separate) subscription state.
   * Uses the live `automationCount` (not the internal never-decreasing counter), so it
   * only fires exactly on the automation that would cross the boundary.
   */
  const getFreeQuotaWarning = (
    instagramIds: string[],
  ): { usedCount: number; limit: number } | null => {
    if (!accounts) return null;
    for (const instagramId of instagramIds) {
      const account = accounts.find((a) => a.id === instagramId);
      if (!account) continue;
      if (
        !account.freeAutomationQuotaExceeded &&
        account.automationCount >= account.freeAutomationLimit
      ) {
        return { usedCount: account.automationCount, limit: account.freeAutomationLimit };
      }
    }
    return null;
  };

  const form = useForm<AutomationFormType>({
    resolver: zodResolver(AutomationFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      instagramIds: filterSelectedIds.length ? filterSelectedIds : [],
      conditionType: ConditionTypesEnum.EQUAL,
      isNoCondition: false,
      commentStartText: t('comment_start_text'),
      commentStartTitle: t('comment_start_title'),
      conditions: [{ type: 'EQUAL', value: '' }],
      contents: [],
      followCheckMessage: t('follow_check_message'),
      isComment: false,
      isCommentContentTargetEnabled: false,
      isDirect: true,
      isRemindersEnabled: false,
      isReplyCommentEnabled: false,
      justFollowers: false,
      enabled: true,
      reminders: [],
    },
  });

  const { defaults: automationDefaults } = useAutomationDefaults(!id);

  useEffect(() => {
    if (id || !automationDefaults) return;

    const dirty = form.formState.dirtyFields;
    if (automationDefaults.commentStartText && !dirty.commentStartText) {
      form.setValue('commentStartText', automationDefaults.commentStartText);
    }
    if (automationDefaults.commentStartTitle && !dirty.commentStartTitle) {
      form.setValue('commentStartTitle', automationDefaults.commentStartTitle);
    }
    if (automationDefaults.followCheckMessage && !dirty.followCheckMessage) {
      form.setValue('followCheckMessage', automationDefaults.followCheckMessage);
    }
  }, [automationDefaults, id]);

  useEffect(() => {
    if (!automation) {
      return;
    }

    const transformButtons = (buttons: any[]) => {
      return buttons?.map((b: any) => {
        const btn = { ...b };

        // Normalize type
        const typeToNormalize = btn.type || btn.postbackPayloadType;

        if (typeToNormalize) {
          const lowerType = typeToNormalize.toLowerCase();
          if (lowerType === 'text' || lowerType === ButtonTypeEnum.TEXT) {
            btn.type = ButtonTypeEnum.TEXT;
            btn.postbackPayloadType = ButtonTypeEnum.TEXT;
          } else if (lowerType === 'url' || lowerType === ButtonTypeEnum.URL) {
            btn.type = ButtonTypeEnum.URL;
            btn.postbackPayloadType = ButtonTypeEnum.URL;
          } else if (
            lowerType === 'contentcycle' ||
            lowerType === 'automation' ||
            typeToNormalize === 'AUTOMATION' ||
            lowerType === ButtonTypeEnum.START_AUTOMATION.toLowerCase()
          ) {
            btn.type = ButtonTypeEnum.START_AUTOMATION;
            btn.postbackPayloadType = ButtonTypeEnum.START_AUTOMATION;
          }
        }

        if (btn.type === ButtonTypeEnum.START_AUTOMATION && btn.destinationContentCycle) {
          return {
            ...btn,
            destinationContentCycleId: btn.destinationContentCycle.id,
          };
        }
        return btn;
      });
    };

    const transformContent = (c: any) => {
      const content = { ...c };
      if (content.buttonTemplate?.buttons) {
        content.buttonTemplate = {
          ...content.buttonTemplate,
        };
        const buttons = transformButtons(content.buttonTemplate.buttons);

        if (content.validationType === ValidationTypeEnum.Selectbox) {
          content.valdationType = ValidationTypeEnum.Text;
        }

        // Sort buttons: if priority exists, use it. Otherwise maintain order (or use ID).
        // Assuming lighter priority value means earlier in the list (1, 2, 3...)
        buttons?.sort((a: any, b: any) => {
          const pA = a.priority ?? 9999;
          const pB = b.priority ?? 9999;
          if (pA !== pB) return pA - pB;
          return 0;
        });

        content.buttonTemplate.buttons = buttons;
      }

      if (content.vitrins?.length) {
        content.vitrins = content.vitrins.map((v) => ({
          ...v,
          imageId: v.images[0]?.id,
          imageUrl: v.images[0]?.url,
          ...(content.vitrins.buttons?.length && {
            buttons: transformButtons(content.vitrins.buttons),
          }),
        }));
      }

      if (content.type === AutomationContentTypesEnum.DELAY) {
        if (content.delayMs >= 1000 * 60 * 60) {
          content.delayUnit = 'hour';
        } else if (content.delayMs >= 1000 * 60) {
          content.delayUnit = 'min';
        } else {
          content.delayUnit = 'sec';
        }
      }

      return content;
    };

    const transformedAutomation = {
      ...automation,
      contents: automation.contents?.map(transformContent),
      reminders: automation.reminders?.map(transformContent),
      conditionType: automation.isNoCondition
        ? ConditionTypesEnum.NO_CONDITION
        : automation.conditions?.[0]?.type,
    };
    form.reset({
      ...transformedAutomation,
      instagramIds:
        automation.instagramLinks?.map((l: { instagramId: string }) => l.instagramId) ?? [],
      ...(transformedAutomation.reminders?.length > 0 && {
        isRemindersEnabled: true,
      }),
      reminderTime: automation.reminderTime ? `${automation.reminderTime}` : undefined,
      isReplyCommentEnabled: !!automation.commentTexts?.length,
      isCommentContentTargetEnabled: !!automation.instagramPost,
    });

    if (copyFromId) {
      toast.success(t('Toast.copied'));
    }
  }, [automation, form, copyFromId, t]);

  const onSubmit = async (values: AutomationFormType) => {
    let haveError: boolean = false;

    const firstType = values.contents[0]?.type;

    // TotalDelays should be under 23 hours
    let totalDelaysMs: number = 0;
    let lastDelayContentIndex: number = null;
    values.contents.forEach((c, index) => {
      if (c.type === AutomationContentTypesEnum.DELAY) {
        totalDelaysMs += c.delayMs;
        lastDelayContentIndex = index;
      }
    });

    if (totalDelaysMs > 1000 * 60 * 60 * 23) {
      toast.error(t('Errors.totalDelayMsShouldBeUnder23Hour'));
      haveError = true;
    }

    if (
      values.isComment &&
      (firstType === AutomationContentTypesEnum.PRODUCT || values.contents.length > 1) &&
      !values.justFollowers &&
      !values.commentStartText
    ) {
      form.setError('commentStartText', {
        message: 'در حالت کامنت، پیام درخواست شروع ضروری است',
      });
      form.setFocus('commentStartText');
      haveError = true;
    }

    if (values.justFollowers) {
      if (!values.followMessage) {
        form.setError('followMessage', {
          message: 'متن درخواست فالو در این حالت اجباری است',
        });
        form.setFocus('followMessage');
        haveError = true;
      }
      if (!values.followCheckMessage) {
        form.setError('followCheckMessage', {
          message: 'متن دکمه بررسی مجدد در این حالت اجباری است',
        });
        form.setFocus('followCheckMessage');
        haveError = true;
      }
    }

    for (const content of values.contents) {
      if (content.type === AutomationContentTypesEnum.PRODUCT) {
        content.productIds = [];
        if (content.products) {
          for (const product of content.products) {
            if (product?.id) {
              content.productIds.push(product.id);
            }
          }
        }
      }
    }

    for (const content of values.reminders) {
      if (content.type === AutomationContentTypesEnum.PRODUCT) {
        content.productIds = [];
        if (content.products) {
          for (const product of content.products) {
            if (product?.id) {
              content.productIds.push(product.id);
            }
          }
        }
      }
    }

    // Set Priority for buttons
    const setButtonPriorities = (contentsList: typeof values.contents) => {
      contentsList.forEach((content) => {
        if (content.buttonTemplate?.buttons) {
          content.buttonTemplate.buttons.forEach((btn, idx) => {
            btn.priority = idx + 1;
          });
        }
      });
    };

    setButtonPriorities(values.contents);
    if (values.reminders) {
      setButtonPriorities(values.reminders);
    }

    if (haveError) {
      setIsSubmitting(false);
      return;
    }

    // Only for brand-new automations: if this would be the automation that pushes a
    // selected page over its free quota, pause and confirm before submitting.
    if (!id) {
      const warning = getFreeQuotaWarning(values.instagramIds);
      if (warning) {
        setPendingSubmitValues(values);
        setFreeQuotaWarning(warning);
        return;
      }
    }

    await submitAutomation(values);
  };

  const submitAutomation = async (values: AutomationFormType) => {
    if (!values.commentStartText) {
      values.commentStartText = automationDefaults?.commentStartText || t('comment_start_text');
    }

    if (!values.commentStartTitle) {
      values.commentStartTitle = automationDefaults?.commentStartTitle || t('comment_start_title');
    }

    if (!values.followCheckMessage) {
      values.followCheckMessage =
        automationDefaults?.followCheckMessage || t('follow_check_message');
    }

    setIsSubmitting(true);

    console.log('Submited values', JSON.stringify(values, undefined, ' '));

    await api({
      method: id ? 'PATCH' : 'POST',
      url: id ? `/contentCycle/${id}` : `/contentCycle`,
      data: values,
    })
      .then((res) => {
        toast.success(id ? t('Toast.updated') : t('Toast.created'));
        router.push('/automations');
        mutate(mutateIncludeStringKey('/contentCycle'));
        automationMutate();
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        if (e.response?.data?.code == 'INSTAGRAM_REQUIRED') {
          toast.error(t_ec(e.response?.data?.code), {
            action: {
              label: t_err('goToInstagram'),
              onClick: () => router.push('/settings/instagram'),
            },
          });
          return;
        }

        // Handle missing translation keys gracefully
        const errorCode = e.response?.data?.code;

        if (errorCode) {
          try {
            const errorMessage = t_ec(errorCode);
            toast.error(errorMessage);
          } catch (translationError) {
            // Fallback to generic error message if translation key doesn't exist
            console.error('Missing translation for error code:', errorCode, translationError);
            toast.error('خطایی رخ داده است');
          }
        } else {
          toast.error('خطایی رخ داده است');
        }
      })
      .then(() => setIsSubmitting(false));
  };

  return (
    <FormProvider {...form}>
      <div className={cn('_automation-form flex min-h-full flex-col gap-5')}>
        {isAutomationLoading || isLoading ? (
          <LoaderSpin />
        ) : (
          <>
            {!hasInstagram && <ConnectInstagramAlert />}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, (e) => {
                  console.log(e);
                  toast.error(t('form_errors'));
                })}
                className="grid gap-3.5"
              >
                <div className="grid gap-5 rounded-xl border bg-white p-4 shadow-sm">
                  <InstagramSelectField />
                  <SeperateLine />

                  <Conditions control={form.control} getValues={form.getValues} />
                  <JustFollowers control={form.control} getValues={form.getValues} />
                  <SeperateLine />

                  <Triggers control={form.control} getValues={form.getValues} />
                  <TargetPostComment />
                </div>

                <div className="grid gap-5 rounded-xl border bg-white p-4 shadow-sm">
                  <Contents automationId={id} mode={AutomationContentModeEnum.AUTOMATION} />
                </div>

                <div className="grid gap-5 rounded-xl border bg-white p-4 shadow-sm">
                  <CommentReplies />

                  <CommentLimitAlert />
                </div>

                <div className="grid gap-5 rounded-xl border bg-white p-4 shadow-sm">
                  <TitleAndEnabled control={form.control} />
                </div>

                <div className="grid gap-5 rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <ButtonLoading isLoading={isSubmitting} className="flex-1">
                      {id ? t('save_changes') : t('add_automation')}
                    </ButtonLoading>
                    <Button
                      variant="outline"
                      type="button"
                      className="flex-1"
                      onClick={() => router.back()}
                    >
                      {t('cancel')}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </>
        )}

        {automationError && <ErrorMessage>{t_ec('LOAD_FAILED')}</ErrorMessage>}
      </div>

      {freeQuotaWarning && (
        <FreeQuotaWarningDialog
          isOpen={!!freeQuotaWarning}
          usedCount={freeQuotaWarning.usedCount}
          limit={freeQuotaWarning.limit}
          onClose={() => {
            setFreeQuotaWarning(null);
            setPendingSubmitValues(null);
          }}
          onConfirm={() => {
            setFreeQuotaWarning(null);
            if (pendingSubmitValues) submitAutomation(pendingSubmitValues);
          }}
        />
      )}
    </FormProvider>
  );
};

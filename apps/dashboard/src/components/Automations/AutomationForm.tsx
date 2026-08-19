'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { mutate } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { AxiosError } from 'axios';

import {
  AutomationBuilder,
  AutomationContentTypesEnum,
  ButtonTypeEnum,
  isCommentStartMessageRequired,
  type AutomationBuilderFormHelpers,
  type AutomationFormType,
} from '@/automation-builder';
import api, { fetcher } from '@/hooks/swr/api-client';
import { useAutomationDefaults } from '@/hooks/useAutomationDefaults';
import { useI18nZodErrors } from '@/hooks/useI18nZodErrors';
import useUser from '@/hooks/useUser';
import { dashboardAutomationApiClient } from '@/lib/automationApiClient';
import { useInstagramFilterStore } from '@/lib/stores/useInstagramFilterStore';
import type { ExceptionMessage } from '@/types/exceptionMessage';
import type { IResponseMessage } from '@/types/responseMessage';
import { InstagramNamespace } from '@/types/instagram';
import {
  clearAutomationDraft,
  getCurrentWorkspaceId,
  readAutomationDraft,
} from '@/utils/automationDraft';
import { mutateIncludeStringKey } from '@/utils/mutateIncludeStringKey';

import { HelpMeDialog } from '@/components/Global/HelpMeDialog';
import { LoaderSpin } from '@/components/ui-custom/LoaderSpin';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';

import { AutomationDraftBanner } from './AutomationDraftBanner';
import { AutomationDraftWatcher } from './AutomationDraftWatcher';
import { ConnectInstagramAlert } from './ConnectInstagramAlert';
import { FreeQuotaWarningDialog } from './FreeQuotaWarningDialog';
import { CommentReplies } from './Form/CommentReplies';
import { InstagramSelectField } from './Form/InstagramSelectField';
import { WizardVideoLinks } from './wizardVideoLinks.conf';

type AutomationFormProps = {
  id?: string;
  copyFromId?: string;
  /**
   * Fetched via `GET /templates/:id` and prefills the form (`initialValue`), mirroring
   * `copyFromId`'s `GET /contentCycle/:id` flow — see `templateKey` below. Unlike
   * `copyFromId`, this path is silent (no toast): nothing is persisted until the user
   * submits, so there's nothing to confirm "copied".
   */
  templateId?: string;
};

/**
 * Reactively derives `isPromotion` (whether any currently-selected Instagram account is on
 * a "promotion" plan) from live form state and hands it back to the parent. Rendered inside
 * `AutomationBuilder`'s `headerSlot` — the only slot documented to run inside its
 * `FormProvider` — since `AutomationBuilder` now owns the `react-hook-form` instance
 * internally and this wrapper has no other way to read `instagramIds` as it changes.
 */
function InstagramPromotionWatcher({
  accounts,
  onChange,
}: {
  accounts?: InstagramNamespace.Account[];
  onChange: (isPromotion: boolean) => void;
}) {
  const { control } = useFormContext<AutomationFormType>();
  const selectedInstagramIds: string[] = useWatch({ control, name: 'instagramIds' }) ?? [];

  useEffect(() => {
    onChange(selectedInstagramIds.some((sid) => accounts?.find((a) => a.id === sid)?.isPromotion));
  }, [selectedInstagramIds, accounts, onChange]);

  return null;
}

/**
 *
 * @param {id} Object This param is optional and specify the component is for Update or Create`
 * @returns
 */
export const AutomationForm = ({ id, copyFromId, templateId }: AutomationFormProps) => {
  useI18nZodErrors();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { hasInstagram, isLoading } = useUser();
  const [isPromotion, setIsPromotion] = useState(false);
  const t = useTranslations('Automations');
  const t_ec = useTranslations('ERROR_CODES');
  const t_err = useTranslations('Automations.Errors');
  const { selectedIds: filterSelectedIds } = useInstagramFilterStore();

  const isUUID = (s?: string) =>
    !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

  const automationSourceId = id ?? copyFromId;
  const workspaceId = getCurrentWorkspaceId();
  const automationKey = isUUID(automationSourceId) ? `/contentCycle/${automationSourceId}` : null;
  // Only consulted for a brand-new automation that isn't already sourced from `id`/`copyFromId` —
  // those two take priority (mirrors the page-level guard: `?templateId=` is only meaningful on
  // a fresh create).
  const templateKey = !id && !copyFromId && isUUID(templateId) ? `/templates/${templateId}` : null;

  const {
    data: automation,
    isLoading: isAutomationLoading,
    error: automationError,
    mutate: automationMutate,
  } = useSWRImmutable(automationKey, {
    revalidateOnMount: !!automationKey,
  });

  const {
    data: templateData,
    isLoading: isTemplateLoading,
    error: templateError,
  } = useSWRImmutable(templateKey, {
    revalidateOnMount: !!templateKey,
  });

  // Same `contents`/`conditions` shape either way (both come off the `ContentCycle` entity),
  // so the single `transformAutomation`-style `initialValue` memo below handles both sources
  // unchanged.
  const source = automation ?? templateData;

  // Same SWR key InstagramSelectField uses — dedupes, no extra request. Carries each
  // page's `automationCount` (live) + `freeAutomationLimit`, used below to warn before
  // the automation that would push a page over its free quota.
  const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
  const { data: accountsResponse } = useSWRImmutable<
    IResponseMessage<InstagramNamespace.Account[]>
  >(`${API_URL}/instagram/accounts`, fetcher, { revalidateOnMount: true });
  const accounts = accountsResponse?.data;

  const [freeQuotaWarning, setFreeQuotaWarning] = useState<{
    usedCount: number;
    limit: number;
    instagramId: string;
  } | null>(null);
  // Resolver for the in-flight `beforeSubmit` promise while the free-quota dialog is open —
  // `onConfirm`/`onClose` resolve it `true`/`false`, letting `AutomationBuilder` continue
  // (or abort) the very submission that triggered the dialog.
  const freeQuotaResolveRef = useRef<((proceed: boolean) => void) | null>(null);

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
  ): { usedCount: number; limit: number; instagramId: string } | null => {
    if (!accounts) return null;
    for (const instagramId of instagramIds) {
      const account = accounts.find((a) => a.id === instagramId);
      if (!account) continue;
      // Exact equality, not `>=`: the backend's sticky `freeAutomationQuotaExceeded` flag
      // is only guaranteed to flip on links created through the normal save/update path
      // (see FreeAutomationQuotaService) — a page whose live count already sits above the
      // limit for any other reason (e.g. pre-existing links from before this feature
      // shipped) would keep failing the `!freeAutomationQuotaExceeded` check and re-show
      // this dialog on every single submission. Matching only the exact boundary value
      // means the dialog can only ever fire once per page — the one submission that takes
      // it from `limit` to `limit + 1` — and self-heals once the live count moves past it,
      // regardless of whether the sticky flag caught up.
      if (
        !account.freeAutomationQuotaExceeded &&
        account.automationCount === account.freeAutomationLimit
      ) {
        return {
          usedCount: account.automationCount,
          limit: account.freeAutomationLimit,
          instagramId: account.id,
        };
      }
    }
    return null;
  };

  const { defaults: automationDefaults, isLoading: isAutomationDefaultsLoading } =
    useAutomationDefaults(!id);

  // Draft-restored banner: `showDraftBanner` starts true only when `initialValue` below
  // was actually seeded from a stored draft. `draftDismissedForBlank` and `formResetKey`
  // together implement the banner's "پیام جدید" (new message) action — see
  // `handleDraftCreateNew` below.
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftDismissedForBlank, setDraftDismissedForBlank] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

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
      content.vitrins = content.vitrins.map((v: any) => ({
        ...v,
        imageId: v.images?.[0]?.id,
        imageUrl: v.images?.[0]?.url,
        ...(v.buttons?.length && {
          buttons: transformButtons(v.buttons),
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

  // Computed once the relevant data is ready (see the `isAutomationLoading`/`isLoading`/
  // `isAutomationDefaultsLoading` gate below) and handed to `AutomationBuilder` as
  // `initialValue` — it's only consumed by `AutomationBuilder`'s own `useForm` at mount, so
  // (unlike the pre-refactor `form.reset(...)` call) it must already be correct by the time
  // `AutomationBuilder` first renders, not patched in afterwards.
  const { value: initialValue, isFromDraft } = useMemo((): {
    value: Partial<AutomationFormType> | undefined;
    isFromDraft: boolean;
  } => {
    if (source) {
      const transformedAutomation = {
        ...source,
        contents: source.contents?.map(transformContent),
        // `?? []`: the copyFromId source (`GET /contentCycle/:id`) always synthesizes
        // `reminders` as an array, but the templateId source (`GET /templates/:id`)
        // omits the field entirely (templates don't load/synthesize reminders — see
        // `ContentCycleService.readOneTemplateById`). Without this fallback,
        // `reminders` ends up `undefined` here and that `undefined` — being an
        // explicit own key on this object — overrides `AutomationBuilder`'s own
        // `reminders: []` default when spread into `initialValue` below, which then
        // fails `AutomationFormSchema`'s (non-optional) `reminders: z.array(...)`
        // check and silently blocks every template-prefilled submit.
        reminders: source.reminders?.map(transformContent) ?? [],
        conditionType: source.isNoCondition ? 'noCondition' : source.conditions?.[0]?.type,
      };

      return {
        value: {
          ...transformedAutomation,
          instagramIds:
            source.instagramLinks?.map((l: { instagramId: string }) => l.instagramId) ?? [],
          ...(transformedAutomation.reminders?.length > 0 && {
            isRemindersEnabled: true,
          }),
          reminderTime: source.reminderTime ? `${source.reminderTime}` : undefined,
          isReplyCommentEnabled: !!source.commentTexts?.length,
          isCommentContentTargetEnabled: !!source.instagramPost,
        },
        isFromDraft: false,
      };
    }

    // Brand-new automation with no copy/template source: a stored local draft (if any)
    // takes priority over blank defaults — this is the resume path. `draftDismissedForBlank`
    // is flipped by `handleDraftCreateNew` ("پیام جدید" on the draft banner), which forces
    // this branch to fall through to the blank defaults below instead.
    if (!id && !copyFromId && !templateId && workspaceId && !draftDismissedForBlank) {
      const draft = readAutomationDraft(workspaceId);
      if (draft) return { value: draft, isFromDraft: true };
    }

    // Brand-new automation: seed the page filter's selection plus the workspace's
    // remembered default texts (falls back to the same hardcoded copy the old form used).
    return {
      value: {
        instagramIds: filterSelectedIds.length ? filterSelectedIds : [],
        commentStartText: automationDefaults?.commentStartText || t('comment_start_text'),
        commentStartTitle: automationDefaults?.commentStartTitle || t('comment_start_title'),
        followCheckMessage: automationDefaults?.followCheckMessage || t('follow_check_message'),
      },
      isFromDraft: false,
    };
    // Only recomputed when the source data (or `draftDismissedForBlank`) changes —
    // `AutomationBuilder` reads this once per mount (remounted via `formResetKey` when the
    // draft is dismissed as "new"), so recomputing on every keystroke elsewhere is both
    // unnecessary and would (if it were re-passed) fight the user's own edits. `workspaceId`
    // is derived from the JWT and is stable for the component's lifetime, so it's
    // intentionally excluded here too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, draftDismissedForBlank]);

  useEffect(() => {
    if (isFromDraft) setShowDraftBanner(true);
  }, [isFromDraft]);

  const handleDraftResume = () => {
    setShowDraftBanner(false);
  };

  const handleDraftCreateNew = () => {
    if (workspaceId) clearAutomationDraft(workspaceId);
    setShowDraftBanner(false);
    setDraftDismissedForBlank(true);
    setFormResetKey((key) => key + 1);
  };

  // Stable reference: `AutomationDraftWatcher` includes `onDirty` in its debounce-save
  // effect's dependency array, so a new function identity on every render would reset
  // that debounce timer on every unrelated `AutomationForm` re-render, not just on
  // actual form changes.
  const handleDraftDirty = useCallback(() => setShowDraftBanner(false), []);

  useEffect(() => {
    // Only the `copyFromId` path confirms with a toast — nothing is persisted yet for either
    // path, but `copyFromId` is explicitly duplicating an existing automation (a copy "happened"
    // from the user's perspective), while `templateId` is a fresh create silently seeded from a
    // template; it gets no toast, per the design spec.
    if (automation && copyFromId) {
      toast.success(t('Toast.copied'));
    }
  }, [automation, copyFromId, t]);

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

    await api({
      method: id ? 'PATCH' : 'POST',
      url: id ? `/contentCycle/${id}` : `/contentCycle`,
      data: values,
    })
      .then(() => {
        toast.success(id ? t('Toast.updated') : t('Toast.created'));
        if (workspaceId) clearAutomationDraft(workspaceId);
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

  /**
   * Runs after `AutomationBuilder`'s own zod validation succeeds, before `onSubmit`.
   * Replicates the cross-field checks + payload normalization the pre-refactor
   * `AutomationForm`'s own `onSubmit` used to do inline (the `followMessage`/
   * `followCheckMessage`-when-`justFollowers` check moved into `AutomationFormSchema`
   * itself, so it isn't repeated here). Returning `false` aborts the submission —
   * `AutomationBuilder` never calls `onSubmit` in that case.
   */
  const handleBeforeSubmit = async (
    values: AutomationFormType,
    { setError, setFocus }: AutomationBuilderFormHelpers,
  ): Promise<boolean> => {
    let haveError = false;

    // TotalDelays should be under 23 hours
    let totalDelaysMs = 0;
    values.contents.forEach((c) => {
      if (c.type === AutomationContentTypesEnum.DELAY) {
        totalDelaysMs += c.delayMs ?? 0;
      }
    });

    if (totalDelaysMs > 1000 * 60 * 60 * 23) {
      toast.error(t('Errors.totalDelayMsShouldBeUnder23Hour'));
      haveError = true;
    }

    // `isCommentStartMessageRequired` is the shared predicate `StartAutomationMessage`
    // itself uses to decide whether to render this field at all — asking it here is what
    // keeps the guard from demanding a value for an automation that never sends the
    // start-request message. This condition used to be inlined and drifted from the
    // field's own: for a self-gating content[0] (a QUESTION, or a TEXT with quick
    // replies) the backend skips the start message entirely (`firstContentSelfGates` in
    // `handleComment`), so the field hides itself and clears `commentStartText` to '' —
    // while this guard still rejected the empty value, leaving the user with a toast
    // about a field that wasn't on screen and no way to submit. BEF-162.
    if (isCommentStartMessageRequired(values) && !values.commentStartText) {
      // Restores the pre-refactor `AutomationForm`'s own inline `onSubmit` behavior: highlight
      // + scroll to the field, not just a toast, since this is a cross-field business rule
      // that `AutomationFormSchema` itself doesn't (and can't cheaply) express.
      setError('commentStartText', {
        message: 'در حالت کامنت، پیام درخواست شروع ضروری است',
      });
      setFocus('commentStartText');
      toast.error('در حالت کامنت، پیام درخواست شروع ضروری است');
      haveError = true;
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
            (btn as { priority?: number }).priority = idx + 1;
          });
        }
      });
    };

    setButtonPriorities(values.contents);
    if (values.reminders) {
      setButtonPriorities(values.reminders);
    }

    if (haveError) return false;

    // Only for brand-new automations: if this would be the automation that pushes a
    // selected page over its free quota, pause and confirm before submitting.
    if (!id) {
      const warning = getFreeQuotaWarning(values.instagramIds);
      if (warning) {
        setFreeQuotaWarning(warning);
        return new Promise<boolean>((resolve) => {
          freeQuotaResolveRef.current = resolve;
        });
      }
    }

    return true;
  };

  /**
   * `AutomationBuilder`'s internal `form.handleSubmit`'s "onInvalid" callback — fires when
   * the shared `zodResolver` rejects the submit. Restores the generic "please fix the
   * form" toast the pre-refactor `AutomationForm`'s own `form.handleSubmit(onSubmit, (e) =>
   * ...)` second argument showed, for the case where the failing field isn't visible
   * above the fold and no per-field message is on screen yet.
   */
  const handleInvalid = () => {
    toast.error(t('form_errors'));
  };

  const resolveFreeQuotaPromise = (proceed: boolean) => {
    setFreeQuotaWarning(null);
    freeQuotaResolveRef.current?.(proceed);
    freeQuotaResolveRef.current = null;
  };

  const triggersHelpProps = {
    title: t('Triggers.Help.title'),
    description: t('Triggers.Help.description'),
    videoSrc: WizardVideoLinks.Automations.Hints.Triggers.video,
    position: 'top-left' as const,
    className: 'top-0 left-0',
  };
  const conditionsHelpProps = {
    title: t('Conditions.Help.title'),
    description: t('Conditions.Help.description'),
    videoSrc: WizardVideoLinks.Automations.Hints.Conditions.video,
    position: 'left' as const,
  };
  const justFollowersHelpProps = {
    title: t('JustFollowers.Help.title'),
    description: t('JustFollowers.Help.description'),
    videoSrc: WizardVideoLinks.Automations.Hints.JustFollowers.video,
    position: 'left' as const,
  };
  const commentTriggerHelpProps = {
    title: t('CommentConsent.Help.title'),
    description: t('CommentConsent.Help.description'),
    videoSrc: WizardVideoLinks.Automations.Hints.CommentConsent.video,
  };

  // One guide per content type (BEF-140 item 4: "every content type needs a guide next
  // to its title"), keyed by `AutomationContentTypesEnum`. Unlike the other help props
  // above, these are brand-new guide locations with nothing hardcoded — content only
  // ever comes from the Admin-managed `/guides/:helpId` CMS (see `guides-table.tsx`).
  const contentTypeHelpSlots = useMemo(
    () =>
      Object.fromEntries(
        Object.values(AutomationContentTypesEnum).map((type) => [
          type,
          <HelpMeDialog
            key={type}
            helpId={`automation_content_${type}`}
            title={t(`Contents.Types.buttons.descriptions.${type}`)}
            noAbsolute
          />,
        ]),
      ) as Partial<Record<AutomationContentTypesEnum, React.ReactNode>>,
    [t],
  );

  const isReady =
    !isAutomationLoading && !isTemplateLoading && !isLoading && !isAutomationDefaultsLoading;

  return (
    <div data-testid="automation-builder-root" className="_automation-form grid min-h-full gap-5">
      {!isReady && <LoaderSpin />}

      {isReady && (
        <AutomationBuilder
          key={formResetKey}
          mode="automation"
          apiClient={dashboardAutomationApiClient}
          initialValue={initialValue}
          isSubmitting={isSubmitting}
          onSubmit={submitAutomation}
          beforeSubmit={handleBeforeSubmit}
          onInvalid={handleInvalid}
          submitLabel={id ? t('save_changes') : t('add_automation')}
          cancelLabel={t('cancel')}
          onCancel={() => router.back()}
          hasInstagram={hasInstagram}
          isPromotion={isPromotion}
          commentRepliesSlot={<CommentReplies />}
          headerSlot={
            <>
              {!id && showDraftBanner && (
                <AutomationDraftBanner
                  onResume={handleDraftResume}
                  onCreateNew={handleDraftCreateNew}
                />
              )}
              <InstagramPromotionWatcher accounts={accounts} onChange={setIsPromotion} />
              {!id && (
                <AutomationDraftWatcher workspaceId={workspaceId} onDirty={handleDraftDirty} />
              )}
              {!hasInstagram && <ConnectInstagramAlert />}
              <InstagramSelectField />
            </>
          }
          helpSlots={{
            triggers: <HelpMeDialog helpId="automation_triggers" {...triggersHelpProps} />,
            conditions: <HelpMeDialog helpId="automation_conditions" {...conditionsHelpProps} />,
            contents: (
              <HelpMeDialog
                helpId="automation_contents"
                title={t('Contents.Help.title')}
                description={t('Contents.Help.description')}
                videoSrc={WizardVideoLinks.Automations.Hints.Contents.video}
                noAbsolute
              />
            ),
            justFollowers: (
              <HelpMeDialog helpId="automation_just_followers" {...justFollowersHelpProps} />
            ),
            commentTrigger: (
              <HelpMeDialog
                helpId="automation_comment_triggers"
                {...commentTriggerHelpProps}
                noAbsolute
              />
            ),
            titleAndEnabled: (
              <HelpMeDialog
                helpId="automation_title"
                title={t('TitleAndEnabled.Help.title')}
                description={t('TitleAndEnabled.Help.description')}
                noAbsolute
              />
            ),
          }}
          contentTypeHelpSlots={contentTypeHelpSlots}
        />
      )}

      {(automationError || templateError) && <ErrorMessage>{t_ec('LOAD_FAILED')}</ErrorMessage>}

      <FreeQuotaWarningDialog
        isOpen={!!freeQuotaWarning}
        usedCount={freeQuotaWarning?.usedCount ?? 0}
        limit={freeQuotaWarning?.limit ?? 0}
        instagramId={freeQuotaWarning?.instagramId ?? ''}
        onClose={() => resolveFreeQuotaPromise(false)}
        onConfirm={() => resolveFreeQuotaPromise(true)}
      />
    </div>
  );
};

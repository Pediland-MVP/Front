'use client';

import { AutomationContentTypesEnum } from '../constants/automationContent.enum';
import type { AutomationFormType } from '../schemas/automationForm';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LockSimpleIcon } from '@phosphor-icons/react/dist/ssr/LockSimple';
import { TrashIcon } from 'lucide-react';

type StartAutomationMessageProps = {
  /** Rendered next to the header label. Replaces the dashboard-only `HelpMeDialog`
   * that used to be hardcoded here. */
  helpSlot?: React.ReactNode;
};

/**
 * The Instagram-mandated "start" message shown before comment-triggered automations
 * with more than one content item. Displayed as a system-added, read-only-header
 * item styled like a real content item, but it is not part of the `contents` array
 * (it always uses `commentStartText` / `commentStartTitle`, submitted separately).
 */
export const StartAutomationMessage = ({ helpSlot }: StartAutomationMessageProps = {}) => {
  const { watch, control, getValues, setValue } = useFormContext<AutomationFormType>();
  const t = useTranslations('Automations.CommentConsent');

  const isComment = watch('isComment');
  const justFollowers = watch('justFollowers');
  const contents = watch('contents');

  const [isActive, setIsActive] = useState(false);
  const [isDeleteLockedDialogOpen, setIsDeleteLockedDialogOpen] = useState(false);

  useEffect(() => {
    // If content[0] already forces the user to tap/answer something (a QUESTION, or a
    // TEXT that already has quick replies — which always get the auto-inserted CONSENT
    // quick reply in Contents.tsx whenever another content follows), that tap/answer
    // already opens Instagram's 24h window on its own. The separate start-request
    // message would just be a redundant extra step. BEF-162.
    const firstContent = contents?.[0];
    const firstContentSelfGates =
      firstContent?.type === AutomationContentTypesEnum.QUESTION ||
      (firstContent?.type === AutomationContentTypesEnum.TEXT &&
        (firstContent.quickReplies?.length ?? 0) > 0);

    const shouldActivate =
      isComment &&
      !justFollowers &&
      !firstContentSelfGates &&
      (contents?.[0]?.type === AutomationContentTypesEnum.PRODUCT || contents?.length > 1);

    if (shouldActivate) {
      if (!getValues('commentStartText')) {
        setValue('commentStartText', t('comment_start_text'));
      }
      setIsActive(true);
    } else {
      setIsActive(false);
      setValue('commentStartText', '');
    }
  }, [isComment, justFollowers, contents, getValues, setValue, t]);

  if (!isActive) return null;

  return (
    <div className="flex flex-col items-start gap-y-4 rounded-xl border border-dashed border-amber-200/75 bg-amber-50/60 p-3">
      <div className="_header relative flex w-full items-center gap-3">
        <div className="bg-amber-550 flex size-5.5 shrink-0 items-center justify-center rounded-full p-0 text-white">
          <LockSimpleIcon size={12} weight="bold" />
        </div>
        <div className="text-secondary text-[13px] font-semibold">{t('start_request_message')}</div>
        {helpSlot}
        <Button
          variant="link"
          size="icon"
          className="text-destructive ms-auto size-5! p-0"
          type="button"
          onClick={() => setIsDeleteLockedDialogOpen(true)}
        >
          <TrashIcon />
        </Button>
      </div>

      <div className="_content flex w-full flex-col gap-3">
        <p className="text-muted-foreground text-[12px] leading-relaxed">
          {t('system_description')}
        </p>

        <FormField
          control={control}
          name="commentStartText"
          render={({ field, fieldState: { error } }) => (
            <FormItem>
              <FormLabel>{t('message_text')}</FormLabel>
              <Textarea
                {...field}
                value={field.value ?? ''}
                placeholder={t('comment_placeholder')}
                rows={3}
              />
              {error && <FormMessage>{error.message}</FormMessage>}
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="commentStartTitle"
          render={({ field, fieldState: { error } }) => (
            <FormItem>
              <FormLabel>{t('comment_start_title')}</FormLabel>
              <Input
                {...field}
                value={field.value ?? ''}
                placeholder={t('comment_start_title_placeholder')}
              />
              {error && <FormMessage>{error.message}</FormMessage>}
            </FormItem>
          )}
        />
      </div>

      <AlertDialog open={isDeleteLockedDialogOpen} onOpenChange={setIsDeleteLockedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_locked_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('delete_locked_description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsDeleteLockedDialogOpen(false)}>
              {t('delete_locked_close')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

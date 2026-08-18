'use client';

import type { AutomationFormType } from '../schemas/automationForm';
import { isCommentStartMessageRequired } from '../utils/commentStart';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

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
import { AutoResizeTextarea } from '@/components/ui-custom/AutoResizeTextarea';
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
  const { control, getValues, setValue } = useFormContext<AutomationFormType>();
  const t = useTranslations('Automations.CommentConsent');

  const isComment = useWatch({ name: 'isComment', control });
  const justFollowers = useWatch({ name: 'justFollowers', control });
  const contents = useWatch({ name: 'contents', control });
  // Only affects the `justFollowers` branch of `isCommentStartMessageRequired`, but it
  // must be watched: setting a reminder is what stops `followerGuard` from ever reaching
  // the start message, so the card has to react to it like any other input.
  const reminderTime = useWatch({ name: 'reminderTime', control });

  const [isDeleteLockedDialogOpen, setIsDeleteLockedDialogOpen] = useState(false);

  const shouldActivate = isCommentStartMessageRequired({
    isComment,
    justFollowers,
    contents,
    reminderTime,
  });

  useEffect(() => {
    // `isCommentStartMessageRequired` is shared with the dashboard's submit-time guard
    // (`AutomationForm.tsx`'s `handleBeforeSubmit`) precisely so the two can never
    // disagree. When they did, this effect cleared `commentStartText` for a self-gating
    // content[0] while that guard still demanded a non-empty value — deadlocking the
    // submit on a field this component no longer even renders. BEF-162.
    if (shouldActivate) {
      if (!getValues('commentStartText')) {
        setValue('commentStartText', t('comment_start_text'));
      }
    } else {
      setValue('commentStartText', '');
    }
  }, [shouldActivate, getValues, setValue, t]);

  if (!shouldActivate) return null;

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
              <AutoResizeTextarea
                {...field}
                value={field.value ?? ''}
                placeholder={t('comment_placeholder')}
                minRows={3}
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

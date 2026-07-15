'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Form } from '@/components/ui';
import { SeperateLine } from '@/components/ui-custom/SeperateLine';
import { Conditions, ConditionTypesEnum } from './Form/Conditions';
import { Triggers } from './Form/Triggers';
import { JustFollowers } from './Form/JustFollowers';
import { CommentTriggerInputs } from './Form/CommentTriggerInputs';
import { CommentLimitAlert } from './Form/CommentLimitAlert';
import { TargetPostComment } from './Form/TargetPostComment';
import { Contents } from './Contents/Contents';
import { AutomationContentModeEnum } from './constants/automationContent.enum';
import { AutomationFormSchema, type AutomationFormType } from './schemas/automationForm';
import type { AutomationBuilderProps } from './AutomationBuilder.types';

export function AutomationBuilder({
  mode,
  apiClient,
  initialValue,
  isSubmitting = false,
  onSubmit,
  onCancel,
  submitLabel,
  cancelLabel,
  headerSlot,
  helpSlots,
  beforeSubmit,
}: AutomationBuilderProps) {
  const [internalSubmitting, setInternalSubmitting] = useState(false);

  const form = useForm<AutomationFormType>({
    resolver: zodResolver(AutomationFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      instagramIds: [],
      conditionType: ConditionTypesEnum.EQUAL,
      isNoCondition: false,
      conditions: [{ type: 'EQUAL', value: '' }],
      contents: [],
      // Required (non-optional) by `AutomationFormSchema` even though it's only
      // meaningful for `mode === 'automation'` — same default the dashboard's
      // `AutomationForm.tsx` uses.
      reminders: [],
      isComment: false,
      isCommentContentTargetEnabled: false,
      isDirect: mode === 'automation',
      isRemindersEnabled: false,
      isReplyCommentEnabled: false,
      justFollowers: false,
      ...initialValue,
    },
  });

  const handleSubmit = async (values: AutomationFormType) => {
    if (beforeSubmit) {
      const shouldProceed = await beforeSubmit(values);
      if (!shouldProceed) return;
    }
    setInternalSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setInternalSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-3.5">
        {headerSlot}

        <div className="grid gap-5 rounded-xl border bg-white p-4 shadow-sm">
          <Conditions
            control={form.control}
            getValues={form.getValues}
            helpSlot={helpSlots?.conditions}
          />
          <SeperateLine />
          <Triggers
            control={form.control}
            getValues={form.getValues}
            helpSlot={helpSlots?.triggers}
          />
          <TargetPostComment apiClient={apiClient} />
        </div>

        <div className="grid gap-5 rounded-xl border bg-white p-4 shadow-sm">
          <Contents
            mode={AutomationContentModeEnum.AUTOMATION}
            apiClient={apiClient}
            helpSlot={helpSlots?.contents}
          />
        </div>

        {mode === 'automation' && (
          <div className="grid gap-5 rounded-xl border bg-white p-4 shadow-sm">
            <JustFollowers
              control={form.control}
              getValues={form.getValues}
              apiClient={apiClient}
              helpSlot={helpSlots?.justFollowers}
            />
            <CommentTriggerInputs helpSlot={helpSlots?.commentTrigger} />
            <CommentLimitAlert />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting || internalSubmitting} className="flex-1">
            {submitLabel}
          </Button>
          <Button variant="outline" type="button" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

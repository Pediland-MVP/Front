'use client';

import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { AutomationFormType } from '@/automation-builder';
import { writeAutomationDraft } from '@/utils/automationDraft';

const DRAFT_SAVE_DEBOUNCE_MS = 1000;

/**
 * Mirrors `InstagramPromotionWatcher` in `AutomationForm.tsx`: rendered inside
 * `AutomationBuilder`'s `headerSlot` purely to reach live `react-hook-form` state via
 * `useFormContext`, since that's the only slot documented to run inside its
 * `FormProvider`. Debounce-persists the form to `localStorage` while dirty. Renders
 * nothing; `workspaceId: null` (no workspace resolved yet, or editing an existing
 * automation) makes it a no-op.
 */
export function AutomationDraftWatcher({ workspaceId }: { workspaceId: string | null }) {
  const { control, formState } = useFormContext<AutomationFormType>();
  const values = useWatch({ control });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!workspaceId || !formState.isDirty) return;

    timeoutRef.current = setTimeout(() => {
      writeAutomationDraft(workspaceId, values as AutomationFormType);
    }, DRAFT_SAVE_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [values, formState.isDirty, workspaceId]);

  return null;
}

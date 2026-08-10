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
 *
 * `onDirty` (optional) fires whenever the form is dirty — used by `AutomationForm` to
 * dismiss the "draft restored" banner the moment the user actually edits something,
 * independent of the (debounced) save itself. It only "arms" a tick after mount (a
 * `setTimeout(0)`, not the next render) — some content types mount-effect their own
 * `setValue(..., { shouldDirty: true })` (e.g. `Contents.tsx` auto-inserting a CONSENT
 * quick reply), which flips `formState.isDirty` true in a *second* render pass right after
 * mount, still well before any real tick elapses. That cascade isn't a user edit and
 * shouldn't dismiss a banner the user hasn't even seen yet; a genuine keystroke always
 * lands well after the arm timer has fired.
 */
export function AutomationDraftWatcher({
  workspaceId,
  onDirty,
}: {
  workspaceId: string | null;
  onDirty?: () => void;
}) {
  const { control, formState } = useFormContext<AutomationFormType>();
  const values = useWatch({ control });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isArmedRef = useRef(false);

  useEffect(() => {
    const armTimer = setTimeout(() => {
      isArmedRef.current = true;
    }, 0);
    return () => clearTimeout(armTimer);
  }, []);

  useEffect(() => {
    if (isArmedRef.current && formState.isDirty) onDirty?.();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!workspaceId || !formState.isDirty) return;

    timeoutRef.current = setTimeout(() => {
      writeAutomationDraft(workspaceId, values as AutomationFormType);
    }, DRAFT_SAVE_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [values, formState.isDirty, workspaceId, onDirty]);

  return null;
}

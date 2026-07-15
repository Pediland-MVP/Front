import type { FieldErrors, UseFormSetError, UseFormSetFocus } from 'react-hook-form';
import type { AutomationBuilderApiClient } from './types/apiClient';
import type { AutomationFormType } from './schemas/automationForm';

/** Handed to `beforeSubmit` as its second argument so a caller-side cross-field check
 * (one not expressible in `AutomationFormSchema` itself) can still highlight/focus the
 * offending field, the same way `form.setError`/`form.setFocus` did in the pre-refactor
 * dashboard `AutomationForm`'s own inline `onSubmit`. */
export interface AutomationBuilderFormHelpers {
  setError: UseFormSetError<AutomationFormType>;
  setFocus: UseFormSetFocus<AutomationFormType>;
}

export type AutomationBuilderMode = 'automation' | 'template';

export type AutomationBuilderHelpSlotKey =
  | 'triggers'
  | 'conditions'
  | 'contents'
  | 'justFollowers'
  | 'commentTrigger';

export interface AutomationBuilderProps {
  /**
   * `'automation'` renders the full dashboard flow (JustFollowers, comment-trigger inputs,
   * comment-limit alert, in addition to Conditions/Triggers/Contents). `'template'` renders
   * only Conditions/Triggers/Contents — templates have no workspace/live-automation context
   * for follow-gating or comment consent, matching the brief's Task 20 scope note.
   */
  mode: AutomationBuilderMode;
  apiClient: AutomationBuilderApiClient;
  initialValue?: Partial<AutomationFormType>;
  /** External submitting state (e.g. while the caller's own network call is in flight),
   * combined with the component's own internal submitting state to disable the submit
   * button either way. */
  isSubmitting?: boolean;
  onSubmit: (values: AutomationFormType) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel: string;
  cancelLabel: string;
  /** Rendered above the Conditions/Triggers section — e.g. the dashboard's
   * `InstagramSelectField` or the admin template form's title/description/thumbnail
   * fields. Rendered inside the form's `FormProvider`, so it can read/write form state via
   * `useFormContext<AutomationFormType>()`. */
  headerSlot?: React.ReactNode;
  /** Per-section help affordances (e.g. a dashboard-only `HelpMeDialog`), replacing the
   * hardcoded dialogs each Form section used to render internally. */
  helpSlots?: Partial<Record<AutomationBuilderHelpSlotKey, React.ReactNode>>;
  /** Runs after schema validation succeeds but before `onSubmit` — return/resolve `false`
   * to abort (e.g. the dashboard's free-quota warning dialog intercepting submission).
   * The second argument exposes `setError`/`setFocus` on the internal form instance, so a
   * cross-field check done here (not expressible in `AutomationFormSchema`) can still
   * highlight and scroll to the offending field before aborting. */
  beforeSubmit?: (
    values: AutomationFormType,
    formHelpers: AutomationBuilderFormHelpers,
  ) => Promise<boolean> | boolean;
  /** Runs when `AutomationBuilder`'s internal `zodResolver` validation fails on submit
   * (the `form.handleSubmit` "onInvalid" callback) — e.g. to show a generic "please fix
   * the form" toast when the failing field isn't visible above the fold. */
  onInvalid?: (errors: FieldErrors<AutomationFormType>) => void;
  /** Whether the current workspace/user already has a connected Instagram account. Passed
   * down to `JustFollowers` (drives its follow-message default). The caller computes this
   * (it used to be read internally via a dashboard-only `useUser()` hook) so this
   * component stays app-agnostic. Irrelevant in `mode="template"` (JustFollowers isn't
   * rendered there). */
  hasInstagram?: boolean;
  /** Whether the currently-selected Instagram account(s) are on a "promotion" plan. Passed
   * down to `Contents` (drives its promotion-upsell banner). Same rationale as
   * `hasInstagram`. */
  isPromotion?: boolean;
  /** Rendered inside the automation-only section, between `JustFollowers` and
   * `CommentTriggerInputs` — the same position the dashboard-only `CommentReplies`
   * component (workspace comment-reply defaults) occupied before the automation-builder
   * move. Not rendered in `mode="template"`. */
  commentRepliesSlot?: React.ReactNode;
}

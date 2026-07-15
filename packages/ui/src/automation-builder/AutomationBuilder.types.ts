import type { AutomationBuilderApiClient } from './types/apiClient';
import type { AutomationFormType } from './schemas/automationForm';

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
   * to abort (e.g. the dashboard's free-quota warning dialog intercepting submission). */
  beforeSubmit?: (values: AutomationFormType) => Promise<boolean> | boolean;
}

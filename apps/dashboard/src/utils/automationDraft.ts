import { decodeJwtPayload } from '@/utils/jwt';
import type { AutomationFormType } from '@/automation-builder';

const DRAFT_KEY_PREFIX = 'automation-draft:';

interface StoredAutomationDraft {
  formValues: unknown;
  savedAt: number;
}

function getAutomationDraftKey(workspaceId: string): string {
  return `${DRAFT_KEY_PREFIX}${workspaceId}`;
}

export function getCurrentWorkspaceId(): string | null {
  return decodeJwtPayload().workspaceId;
}

// Deliberately lenient: this only guards against corrupted/garbage JSON (or a future,
// incompatible draft format), not against genuinely in-progress partial form data — a
// real draft mid-edit will often not yet satisfy AutomationFormSchema's submit-time
// constraints (e.g. instagramIds/contents min(1)), and that's expected/fine to restore.
function isPlausibleAutomationDraft(value: unknown): value is Partial<AutomationFormType> {
  return (
    typeof value === 'object' && value !== null && !Array.isArray(value) && 'contents' in value
  );
}

export function readAutomationDraft(workspaceId: string): Partial<AutomationFormType> | null {
  if (typeof localStorage === 'undefined') return null;

  const raw = localStorage.getItem(getAutomationDraftKey(workspaceId));
  if (!raw) return null;

  try {
    const stored = JSON.parse(raw) as StoredAutomationDraft;
    return isPlausibleAutomationDraft(stored.formValues) ? stored.formValues : null;
  } catch {
    return null;
  }
}

export function hasAutomationDraft(workspaceId: string): boolean {
  return readAutomationDraft(workspaceId) !== null;
}

export function writeAutomationDraft(workspaceId: string, formValues: AutomationFormType): void {
  if (typeof localStorage === 'undefined') return;

  const stored: StoredAutomationDraft = { formValues, savedAt: Date.now() };
  localStorage.setItem(getAutomationDraftKey(workspaceId), JSON.stringify(stored));
}

export function clearAutomationDraft(workspaceId: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(getAutomationDraftKey(workspaceId));
}

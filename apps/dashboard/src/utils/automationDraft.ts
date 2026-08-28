import { decodeJwtPayload } from '@/utils/jwt';
import type { AutomationFormType } from '@/automation-builder';

const DRAFT_KEY_PREFIX = 'automation-draft:';
const DRAFT_TTL_MS = 2 * 24 * 60 * 60 * 1000;

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

/**
 * `contents[].fileTemp` / `reminders[].fileTemp` hold the raw `File` the user just picked.
 * A `File` has no enumerable own properties, so `JSON.stringify` turns it into a bare `{}`:
 * the saved draft keeps a file-shaped entry that has lost its `type`, `size` and `name` and
 * can never be uploaded. Restoring one used to crash the whole /automations/add page on
 * `file.type.split('/')` (Sentry MY-41).
 *
 * So drop `fileTemp` entirely — on write, so new drafts never carry it, and on read, so the
 * drafts already sitting in users' `localStorage` (2-day TTL) are cleaned up too. The content
 * item itself is kept; the user just re-picks its file.
 */
function stripFileTemp(formValues: Partial<AutomationFormType>): Partial<AutomationFormType> {
  const dropFileTemp = <T extends { fileTemp?: unknown }>(items: T[]): T[] =>
    items.map((item) => {
      if (!item || typeof item !== 'object' || !('fileTemp' in item)) return item;
      const { fileTemp: _fileTemp, ...rest } = item;
      return rest as T;
    });

  return {
    ...formValues,
    ...(Array.isArray(formValues.contents) && { contents: dropFileTemp(formValues.contents) }),
    ...(Array.isArray(formValues.reminders) && { reminders: dropFileTemp(formValues.reminders) }),
  };
}

export function readAutomationDraft(workspaceId: string): Partial<AutomationFormType> | null {
  if (typeof localStorage === 'undefined') return null;

  const raw = localStorage.getItem(getAutomationDraftKey(workspaceId));
  if (!raw) return null;

  try {
    const stored = JSON.parse(raw) as StoredAutomationDraft;

    if (Date.now() - stored.savedAt > DRAFT_TTL_MS) {
      localStorage.removeItem(getAutomationDraftKey(workspaceId));
      return null;
    }

    return isPlausibleAutomationDraft(stored.formValues) ? stripFileTemp(stored.formValues) : null;
  } catch {
    return null;
  }
}

export function writeAutomationDraft(workspaceId: string, formValues: AutomationFormType): void {
  if (typeof localStorage === 'undefined') return;

  const stored: StoredAutomationDraft = {
    formValues: stripFileTemp(formValues),
    savedAt: Date.now(),
  };
  localStorage.setItem(getAutomationDraftKey(workspaceId), JSON.stringify(stored));
}

export function clearAutomationDraft(workspaceId: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(getAutomationDraftKey(workspaceId));
}

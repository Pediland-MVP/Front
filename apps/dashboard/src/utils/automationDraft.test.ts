import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/jwt', () => ({
  decodeJwtPayload: vi.fn(),
}));

import { decodeJwtPayload } from '@/utils/jwt';
import {
  getCurrentWorkspaceId,
  readAutomationDraft,
  writeAutomationDraft,
  clearAutomationDraft,
} from './automationDraft';

const WORKSPACE_ID = 'ws-123';
const OTHER_WORKSPACE_ID = 'ws-456';

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('getCurrentWorkspaceId', () => {
  it('reads workspaceId via decodeJwtPayload', () => {
    (decodeJwtPayload as ReturnType<typeof vi.fn>).mockReturnValue({
      workspaceId: WORKSPACE_ID,
      userId: 'u-1',
    });
    expect(getCurrentWorkspaceId()).toBe(WORKSPACE_ID);
  });

  it('returns null when there is no workspaceId', () => {
    (decodeJwtPayload as ReturnType<typeof vi.fn>).mockReturnValue({
      workspaceId: null,
      userId: null,
    });
    expect(getCurrentWorkspaceId()).toBeNull();
  });
});

describe('writeAutomationDraft / readAutomationDraft', () => {
  it('round-trips a full form snapshot', () => {
    const values = { contents: [{ type: 'text', text: 'hi' }], instagramIds: ['ig-1'] } as any;
    writeAutomationDraft(WORKSPACE_ID, values);

    expect(readAutomationDraft(WORKSPACE_ID)).toEqual(values);
  });

  it('round-trips a partial (still-in-progress) form snapshot with no instagramIds/contents yet', () => {
    const values = { contents: [], title: 'در حال تایپ' } as any;
    writeAutomationDraft(WORKSPACE_ID, values);

    expect(readAutomationDraft(WORKSPACE_ID)).toEqual(values);
  });

  it('keeps drafts isolated per workspace', () => {
    writeAutomationDraft(WORKSPACE_ID, { contents: [{ type: 'text', text: 'A' }] } as any);
    writeAutomationDraft(OTHER_WORKSPACE_ID, { contents: [{ type: 'text', text: 'B' }] } as any);

    expect((readAutomationDraft(WORKSPACE_ID) as any).contents[0].text).toBe('A');
    expect((readAutomationDraft(OTHER_WORKSPACE_ID) as any).contents[0].text).toBe('B');
  });

  it('returns null when nothing is stored', () => {
    expect(readAutomationDraft(WORKSPACE_ID)).toBeNull();
  });

  it('returns null and does not throw for corrupted JSON', () => {
    localStorage.setItem(`automation-draft:${WORKSPACE_ID}`, 'not-json{{{');
    expect(readAutomationDraft(WORKSPACE_ID)).toBeNull();
  });

  it('returns null for a stored value that is not a plausible draft shape', () => {
    localStorage.setItem(
      `automation-draft:${WORKSPACE_ID}`,
      JSON.stringify({ formValues: 'just a string', savedAt: Date.now() }),
    );
    expect(readAutomationDraft(WORKSPACE_ID)).toBeNull();
  });
});

describe('draft expiry (2-day TTL)', () => {
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

  it('returns a draft saved just under 2 days ago', () => {
    localStorage.setItem(
      `automation-draft:${WORKSPACE_ID}`,
      JSON.stringify({ formValues: { contents: [] }, savedAt: Date.now() - (TWO_DAYS_MS - 1000) }),
    );
    expect(readAutomationDraft(WORKSPACE_ID)).toEqual({ contents: [] });
  });

  it('returns null and clears the entry for a draft older than 2 days', () => {
    localStorage.setItem(
      `automation-draft:${WORKSPACE_ID}`,
      JSON.stringify({ formValues: { contents: [] }, savedAt: Date.now() - (TWO_DAYS_MS + 1000) }),
    );
    expect(readAutomationDraft(WORKSPACE_ID)).toBeNull();
    expect(localStorage.getItem(`automation-draft:${WORKSPACE_ID}`)).toBeNull();
  });
});

describe('clearAutomationDraft', () => {
  it('removes the stored draft for that workspace only', () => {
    writeAutomationDraft(WORKSPACE_ID, { contents: [] } as any);
    writeAutomationDraft(OTHER_WORKSPACE_ID, { contents: [] } as any);

    clearAutomationDraft(WORKSPACE_ID);

    expect(readAutomationDraft(WORKSPACE_ID)).toBeNull();
    expect(readAutomationDraft(OTHER_WORKSPACE_ID)).not.toBeNull();
  });
});

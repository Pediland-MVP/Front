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

describe('fileTemp is never persisted (Sentry MY-41)', () => {
  const pickedFile = () => new File(['x'], 'photo.png', { type: 'image/png' });

  it('drops contents[].fileTemp on write, keeping the rest of the content item', () => {
    writeAutomationDraft(WORKSPACE_ID, {
      contents: [
        { type: 'IMAGE', text: 'hi', fileTemp: { file: pickedFile(), id: 1 } },
        { type: 'TEXT', text: 'bye' },
      ],
    } as any);

    // Asserted against raw storage, not the read path: nothing unrestorable is written out
    // in the first place.
    const raw = localStorage.getItem(`automation-draft:${WORKSPACE_ID}`) ?? '';
    expect(raw).not.toContain('fileTemp');

    const contents = JSON.parse(raw).formValues.contents;
    expect(contents).toHaveLength(2);
    expect(contents[0]).toEqual({ type: 'IMAGE', text: 'hi' });
    expect(contents[1]).toEqual({ type: 'TEXT', text: 'bye' });
  });

  it('drops reminders[].fileTemp on write', () => {
    writeAutomationDraft(WORKSPACE_ID, {
      contents: [],
      reminders: [{ type: 'IMAGE', fileTemp: { file: pickedFile(), id: 2 } }],
    } as any);

    const raw = localStorage.getItem(`automation-draft:${WORKSPACE_ID}`) ?? '';
    expect(raw).not.toContain('fileTemp');
    expect(JSON.parse(raw).formValues.reminders[0]).toEqual({ type: 'IMAGE' });
  });

  // Drafts written by an older bundle are already in users' localStorage, where a `File`
  // had serialized down to a bare `{}` that the media uploader could not render.
  it('drops a fileTemp left behind by an already-stored draft on read', () => {
    localStorage.setItem(
      `automation-draft:${WORKSPACE_ID}`,
      JSON.stringify({
        formValues: { contents: [{ type: 'IMAGE', fileTemp: { file: {}, id: 3 } }] },
        savedAt: Date.now(),
      }),
    );

    const contents = (readAutomationDraft(WORKSPACE_ID) as any).contents;
    expect(contents[0]).toEqual({ type: 'IMAGE' });
  });

  it('leaves an already-uploaded content file alone', () => {
    writeAutomationDraft(WORKSPACE_ID, {
      contents: [{ type: 'IMAGE', file: { id: 9, url: 'https://x/y.png', mimeType: 'image/png' } }],
    } as any);

    expect((readAutomationDraft(WORKSPACE_ID) as any).contents[0].file).toEqual({
      id: 9,
      url: 'https://x/y.png',
      mimeType: 'image/png',
    });
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

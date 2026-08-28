import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MediaUploader } from '../MediaUploader';
import {
  AutomationContentModeEnum,
  AutomationContentTypesEnum,
} from '@/automation-builder/constants/automationContent.enum';
import type { UploadedFile } from '@/types/fileUploader';

// MediaUploader renders several `useTranslations(...)` calls. Without a
// `NextIntlClientProvider` this throws "No intl context found", so stub the hook to just
// echo the translation key back.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// jsdom ships no object-URL implementation; the image preview needs one.
beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', { value: () => 'blob:stub', writable: true });
});

function renderUploader(files: UploadedFile[], content: unknown = undefined) {
  return render(
    <MediaUploader
      files={files}
      setFiles={vi.fn()}
      onChange={vi.fn()}
      appendContents={vi.fn()}
      mode={AutomationContentModeEnum.AUTOMATION}
      fileType={AutomationContentTypesEnum.IMAGE}
      content={content as never}
    />,
  );
}

describe('MediaUploader preview', () => {
  it('renders a real picked File without throwing', () => {
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    expect(() => renderUploader([{ file, id: 1 }])).not.toThrow();
  });

  it('renders an already-uploaded file without throwing', () => {
    expect(() =>
      renderUploader([{ id: 2, url: 'https://x/y.png', mimeType: 'image/png' }]),
    ).not.toThrow();
  });

  // Regression: a draft restored from localStorage round-trips every `File` through
  // `JSON.stringify`, which leaves `{}` behind — so `file.file.type` is undefined and the
  // old `uploadedFile.type.split('/')` blew up the whole /automations/add page.
  // Sentry MY-41.
  it('does not throw when a restored draft left a file with no type behind', () => {
    const deadFile = JSON.parse(
      JSON.stringify({ file: new File(['x'], 'photo.png', { type: 'image/png' }), id: 3 }),
    );
    expect(deadFile.file.type).toBeUndefined();

    expect(() => renderUploader([deadFile])).not.toThrow();
  });

  it('does not throw when a stored item lost its file entirely', () => {
    expect(() => renderUploader([{ id: 4 } as unknown as UploadedFile])).not.toThrow();
  });

  it('shows no file size instead of "NaN MB" for a file with no size', () => {
    const deadFile = JSON.parse(
      JSON.stringify({ file: new File(['x'], 'photo.png', { type: 'image/png' }), id: 6 }),
    );
    renderUploader([deadFile]);
    expect(screen.queryByText(/NaN/)).toBeNull();
  });
});

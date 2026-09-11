import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FileUploader } from '../FileUploader';

// FileUploader renders `useTranslations('FileUpload')` calls. Without a
// `NextIntlClientProvider` this throws "No intl context found" — stub it to echo the
// translation key back, same approach as other ui-custom/automation-builder tests.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// react-dropzone's useDropzone is exercised through its real implementation here (it's a
// plain hook, no DOM APIs jsdom is missing), so we can assert on the actual `multiple`
// value it was configured with rather than mocking it away.
vi.mock('react-dropzone', async () => {
  const actual = await vi.importActual<typeof import('react-dropzone')>('react-dropzone');
  return {
    ...actual,
    useDropzone: vi.fn(actual.useDropzone),
  };
});

import { useDropzone } from 'react-dropzone';

describe('FileUploader', () => {
  it('defaults to single-file: native input has no `multiple` attribute and useDropzone gets multiple: false', () => {
    const { container } = render(<FileUploader />);

    const input = container.querySelector('#file-upload-handle') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.multiple).toBe(false);

    expect(useDropzone).toHaveBeenCalledWith(expect.objectContaining({ multiple: false }));
  });

  it('with multiple={true}: native input gets the `multiple` attribute and useDropzone gets multiple: true', () => {
    const { container } = render(<FileUploader multiple />);

    const input = container.querySelector('#file-upload-handle') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.multiple).toBe(true);

    expect(useDropzone).toHaveBeenCalledWith(expect.objectContaining({ multiple: true }));
  });
});

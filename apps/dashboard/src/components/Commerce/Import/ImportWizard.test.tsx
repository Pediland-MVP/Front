import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: toastError, success: vi.fn() } }));

const { post, fetcherMock } = vi.hoisted(() => ({
  post: vi.fn(),
  fetcherMock: vi.fn(),
}));
vi.mock('@/hooks/swr/api-client', () => ({
  default: { post },
  fetcher: fetcherMock,
}));

// `can` defaults to true (every existing test above assumes full create permission) — the
// dedicated permission-gating suite below overrides it to false, same mocking convention
// `ProductListPage.test.tsx` uses for `usePermissions`.
const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(true) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: mockCan }),
}));

import messages from '@/messages/fa.json';
import { ImportWizard } from './ImportWizard';

function renderWizard() {
  return render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <ImportWizard />
    </NextIntlClientProvider>,
  );
}

const t = messages.Commerce.Import;

beforeEach(() => {
  vi.clearAllMocks();
  mockCan.mockReset().mockReturnValue(true);
});

describe('ImportWizard', () => {
  it('starts on the upload step with a link to the fixed-column-order sample file', () => {
    renderWizard();

    expect(screen.getByText(t.upload.title)).toBeInTheDocument();
    const sampleLink = screen.getByText(t.upload.downloadSample).closest('a');
    expect(sampleLink).toHaveAttribute('href', '/commerce-import-sample.csv');
    expect(sampleLink).toHaveAttribute('download');
  });

  it('uploads the selected file, moves to processing, then to the result step once the job is terminal — no column-mapping or preview step in between', async () => {
    post.mockResolvedValue({ data: { data: { jobId: 'job-42' } } });
    fetcherMock.mockResolvedValue({
      data: {
        state: 'completed',
        processed: 3,
        failed: 1,
        errorReportUrl: 'https://cdn.example.com/error-report-7.xlsx',
      },
    });

    renderWizard();

    const file = new File(['title,...'], 'products.csv', { type: 'text/csv' });
    const input = document.querySelector('#file-upload-handle') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        '/commerce/import',
        expect.any(FormData),
        expect.anything(),
      ),
    );

    // Processing step appears next — never a mapping/preview step (the structural
    // simplification called out in the design spec).
    await waitFor(() => expect(screen.getByText(t.processing.title)).toBeInTheDocument());
    expect(screen.queryByText(/mapping|نگاشت|پیش‌نمایش/)).not.toBeInTheDocument();

    // The hook's first fetch fires on mount (not gated by any interval), and the mocked
    // fetcher already resolves to a terminal state, so the wizard flips to the result step as
    // soon as that promise settles.
    await waitFor(() => expect(screen.getByText(t.result.title)).toBeInTheDocument());
    expect(screen.getByTestId('import-result-processed')).toHaveTextContent('3');
    expect(screen.getByTestId('import-result-failed')).toHaveTextContent('1');
    // The error-report link is real now that the backend resolves the file id to a URL.
    const downloadLink = screen.getByText(t.result.downloadErrorReport).closest('a')!;
    expect(downloadLink).toHaveAttribute('href', 'https://cdn.example.com/error-report-7.xlsx');
    expect(downloadLink).toHaveAttribute('download');
  });

  it('does not render the error-report link when the job had no error report', async () => {
    // Distinct jobId from the previous test so the SWR cache key differs — otherwise the
    // previous test's cached `/commerce/import/job-42` response could leak into this one.
    post.mockResolvedValue({ data: { data: { jobId: 'job-43' } } });
    fetcherMock.mockResolvedValue({
      data: { state: 'completed', processed: 5, failed: 0 },
    });

    renderWizard();

    const file = new File(['title,...'], 'products.csv', { type: 'text/csv' });
    const input = document.querySelector('#file-upload-handle') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText(t.result.title)).toBeInTheDocument());
    expect(screen.queryByText(t.result.downloadErrorReport)).not.toBeInTheDocument();
  });

  it('stays on the upload step and toasts a translated error when the upload request fails', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { data: { code: 'COMMERCE_IMPORT_INVALID_FILE' } },
    });

    renderWizard();

    const file = new File(['bad'], 'products.txt', { type: 'text/plain' });
    const input = document.querySelector('#file-upload-handle') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(messages.ERROR_CODES.COMMERCE_IMPORT_INVALID_FILE),
    );
    expect(screen.getByText(t.upload.title)).toBeInTheDocument();
  });
});

describe('ImportWizard permission gating', () => {
  it('hides the uploader and never POSTs when the viewer lacks product:create', () => {
    mockCan.mockReturnValue(false);
    renderWizard();

    expect(document.querySelector('#file-upload-handle')).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });
});

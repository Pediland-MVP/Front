import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import type { CommerceProductMedia } from '@/types/commerce';

// `MediaSection` must never keep a parallel local `useState` media array — every mutation
// (upload/delete/reorder) has to revalidate the SAME `/commerce/products/:id` SWR key
// `ProductEditorPage.tsx` uses. Mock the global `mutate` so these tests assert on THAT call,
// not on a locally-appended tile.
const { mutateMock } = vi.hoisted(() => ({ mutateMock: vi.fn().mockResolvedValue(undefined) }));
vi.mock('swr', () => ({ mutate: mutateMock }));

const { post, del, patch } = vi.hoisted(() => ({
  post: vi.fn().mockResolvedValue({ data: {} }),
  del: vi.fn().mockResolvedValue({ data: {} }),
  patch: vi.fn().mockResolvedValue({ data: {} }),
}));
vi.mock('@/hooks/swr/api-client', () => ({
  default: { post, delete: del, patch },
}));

// `can` defaults to true (every existing test above assumes full edit permission) — the
// dedicated permission-gating suite below overrides it to false, same mocking convention
// `ProductListPage.test.tsx` uses for `usePermissions`.
const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(true) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: mockCan }),
}));

// jsdom has no real pointer/drag support, so exercising @dnd-kit's actual sensors isn't
// feasible here (there's no existing test in this repo that drives real dnd-kit drag events
// either — `SortableButtonItem`/`FormVitrinButtons` have no test file to mirror). Instead,
// capture the `onDragEnd` handler `MediaSection` passes to the real `DndContext` and invoke
// it directly with a synthetic drag event. Everything else from `@dnd-kit/core` (sensors,
// `closestCenter`, the internal context defaults `useSortable` reads) stays real, so
// `useSortable` inside each tile still renders without crashing.
let capturedOnDragEnd: ((event: unknown) => void | Promise<void>) | undefined;
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual<typeof import('@dnd-kit/core')>('@dnd-kit/core');
  return {
    ...actual,
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: React.ReactNode;
      onDragEnd: (event: unknown) => void | Promise<void>;
    }) => {
      capturedOnDragEnd = onDragEnd;
      return children;
    },
  };
});

import messages from '@/messages/fa.json';
import { MediaSection } from './MediaSection';

const IMAGE: CommerceProductMedia = {
  id: 'media-1',
  type: 'image',
  position: 0,
  alt: null,
  url: 'https://cdn.example.com/media-1.jpg',
  posterUrl: null,
};

const VIDEO: CommerceProductMedia = {
  id: 'media-2',
  type: 'video',
  position: 1,
  alt: null,
  url: 'https://cdn.example.com/media-2.mp4',
  posterUrl: 'https://cdn.example.com/media-2-poster.jpg',
};

function renderSection(media: CommerceProductMedia[], mode: 'create' | 'edit' = 'edit') {
  return render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <MediaSection
        step={4}
        mode={mode}
        productId={mode === 'edit' ? 'prod-1' : undefined}
        media={media}
      />
    </NextIntlClientProvider>,
  );
}

// jsdom implements neither of these; the create-mode preview grid calls both.
beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
});

beforeEach(() => {
  vi.clearAllMocks();
  mutateMock.mockResolvedValue(undefined);
  post.mockResolvedValue({ data: {} });
  del.mockResolvedValue({ data: {} });
  patch.mockResolvedValue({ data: {} });
  capturedOnDragEnd = undefined;
  mockCan.mockReset().mockReturnValue(true);
});

describe('MediaSection', () => {
  it('queues files locally in create mode and uploads nothing until the product exists', () => {
    const onPendingFilesChange = vi.fn();
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <MediaSection
          step={4}
          mode="create"
          productId={undefined}
          media={[]}
          pendingFiles={[]}
          onPendingFilesChange={onPendingFilesChange}
        />
      </NextIntlClientProvider>,
    );

    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    const input = screen.getByTestId('media-file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    // The queue is handed up to ProductEditorPage; the media endpoint needs a product id in
    // the path, so nothing may be POSTed here.
    expect(onPendingFilesChange).toHaveBeenCalledWith([file]);
    expect(post).not.toHaveBeenCalled();
  });

  it('previews queued files in create mode, marks the first as the cover, and can remove one', () => {
    const onPendingFilesChange = vi.fn();
    const first = new File(['a'], 'first.png', { type: 'image/png' });
    const second = new File(['b'], 'second.png', { type: 'image/png' });
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <MediaSection
          step={4}
          mode="create"
          productId={undefined}
          media={[]}
          pendingFiles={[first, second]}
          onPendingFilesChange={onPendingFilesChange}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByTestId('pending-media-0')).toBeInTheDocument();
    expect(screen.getByTestId('pending-media-1')).toBeInTheDocument();
    // Index 0 uploads first and so becomes position 0 — the cover.
    expect(screen.getByText(messages.Commerce.Editor.Media.cover)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('pending-media-remove-0'));
    expect(onPendingFilesChange).toHaveBeenCalledWith([second]);
    expect(post).not.toHaveBeenCalled();
  });

  it('uploads a file then revalidates the product-detail SWR key instead of rendering the POST response', async () => {
    renderSection([]);

    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    const input = screen.getByTestId('media-file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        '/commerce/products/prod-1/media',
        expect.any(FormData),
        expect.anything(),
      ),
    );

    // The refetch (not a locally-appended tile) is what's expected to surface the real,
    // resolved `url` — the POST response itself has none.
    await waitFor(() => expect(mutateMock).toHaveBeenCalledWith('/commerce/products/prod-1'));
  });

  it('renders the video fixture posterUrl instead of embedding/playing the video inline', () => {
    renderSection([VIDEO]);

    const img = screen.getByAltText('') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(VIDEO.posterUrl);
    expect(document.querySelector('video')).not.toBeInTheDocument();
  });

  it('shows the cover badge on whichever item currently has position === 0', () => {
    renderSection([IMAGE, VIDEO]);
    expect(screen.getByText(messages.Commerce.Editor.Media.cover)).toBeInTheDocument();
  });

  it('deletes a media item via DELETE then revalidates the SWR key', async () => {
    renderSection([IMAGE]);

    fireEvent.click(screen.getByLabelText(messages.Commerce.Editor.Media.delete));

    await waitFor(() =>
      expect(del).toHaveBeenCalledWith('/commerce/products/prod-1/media/media-1'),
    );
    await waitFor(() => expect(mutateMock).toHaveBeenCalledWith('/commerce/products/prod-1'));
  });

  it('on drag end, PATCHes the full reordered mediaIds then revalidates the SWR key', async () => {
    renderSection([IMAGE, VIDEO]);

    expect(capturedOnDragEnd).toBeDefined();

    await capturedOnDragEnd!({
      active: { id: 'media-2' },
      over: { id: 'media-1' },
    });

    // Optimistic write straight into the shared SWR cache (no parallel local state), with
    // `revalidate: false` so it doesn't race the PATCH below.
    expect(mutateMock).toHaveBeenCalledWith('/commerce/products/prod-1', expect.any(Function), {
      revalidate: false,
    });

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/commerce/products/prod-1/media', {
        mediaIds: ['media-2', 'media-1'],
      }),
    );

    // Final revalidate once the PATCH settles, same one-key pattern as upload/delete.
    await waitFor(() => expect(mutateMock).toHaveBeenCalledWith('/commerce/products/prod-1'));
  });

  it('does nothing when a drag ends over the same item (no-op drop)', async () => {
    renderSection([IMAGE, VIDEO]);

    await capturedOnDragEnd!({
      active: { id: 'media-1' },
      over: { id: 'media-1' },
    });

    expect(patch).not.toHaveBeenCalled();
    expect(mutateMock).not.toHaveBeenCalled();
  });
});

describe('MediaSection permission gating', () => {
  beforeEach(() => {
    mockCan.mockReturnValue(false);
  });

  it('hides the uploader and never calls upload/delete/reorder endpoints when the viewer lacks product:edit', async () => {
    renderSection([IMAGE, VIDEO]);

    // The uploader control itself must not be rendered — there is nothing to click.
    expect(screen.queryByTestId('media-dropzone')).not.toBeInTheDocument();
    // The per-tile delete button and drag handle are also hidden.
    expect(screen.queryByLabelText(messages.Commerce.Editor.Media.delete)).not.toBeInTheDocument();

    // Defense-in-depth: even if a drag end somehow fired, the handler itself must no-op.
    expect(capturedOnDragEnd).toBeDefined();
    await capturedOnDragEnd!({ active: { id: 'media-2' }, over: { id: 'media-1' } });

    expect(post).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
    expect(patch).not.toHaveBeenCalled();
    expect(mutateMock).not.toHaveBeenCalled();
  });
});

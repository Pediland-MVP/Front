import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import type { CommerceProductMedia } from '@/types/commerce';

// Same convention `MediaSection.test.tsx` uses: this dialog must revalidate/write into the
// SAME shared `/commerce/products/:id` SWR key, never a redundant local fetch — mock the
// global `mutate` so the tests can assert on that call.
const { mutateMock } = vi.hoisted(() => ({ mutateMock: vi.fn().mockResolvedValue(undefined) }));
vi.mock('swr', () => ({ mutate: mutateMock }));

const { put } = vi.hoisted(() => ({ put: vi.fn().mockResolvedValue({ data: {} }) }));
vi.mock('@/hooks/swr/api-client', () => ({ default: { put } }));

import messages from '@/messages/fa.json';
import { VariantMediaPickerDialog } from './VariantMediaPickerDialog';

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

function renderDialog(
  pool: CommerceProductMedia[],
  initialAssignment?: { selectedMediaIds: string[]; coverMediaId: string | null },
) {
  const onOpenChange = vi.fn();
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <VariantMediaPickerDialog
        open
        onOpenChange={onOpenChange}
        productId="prod-1"
        variantId="var-1"
        variantLabel="۵۰۰ گرم / بدون جعبه"
        pool={pool}
        initialAssignment={initialAssignment}
      />
    </NextIntlClientProvider>,
  );
  return { onOpenChange };
}

beforeEach(() => {
  vi.clearAllMocks();
  mutateMock.mockResolvedValue(undefined);
  put.mockResolvedValue({ data: {} });
});

describe('VariantMediaPickerDialog', () => {
  it('shows the variant label as the subtitle', () => {
    renderDialog([IMAGE]);
    expect(screen.getByText('۵۰۰ گرم / بدون جعبه')).toBeInTheDocument();
  });

  it('renders the video tile poster, never an embedded/playing video', () => {
    renderDialog([VIDEO]);
    const img = screen.getByAltText('') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(VIDEO.posterUrl);
    expect(document.querySelector('video')).not.toBeInTheDocument();
  });

  it('selecting a tile then saving PUTs the selection with no cover (star never clicked)', async () => {
    renderDialog([IMAGE, VIDEO]);

    fireEvent.click(screen.getByTestId('media-pool-tile-media-1'));
    fireEvent.click(screen.getByText(messages.Commerce.Editor.VariantMedia.save));

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/commerce/products/prod-1/variants/var-1/media', {
        mediaIds: ['media-1'],
      }),
    );
  });

  it('star click auto-selects the tile and sets it as cover, then saving sends coverMediaId', async () => {
    renderDialog([IMAGE, VIDEO]);

    // Star-click media-2 WITHOUT selecting it first — must auto-include it.
    fireEvent.click(screen.getByTestId('media-pool-tile-star-media-2'));
    fireEvent.click(screen.getByText(messages.Commerce.Editor.VariantMedia.save));

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/commerce/products/prod-1/variants/var-1/media', {
        mediaIds: ['media-2'],
        coverMediaId: 'media-2',
      }),
    );
  });

  it('deselecting the current cover tile clears the cover along with the selection', async () => {
    renderDialog([IMAGE, VIDEO], { selectedMediaIds: ['media-1'], coverMediaId: 'media-1' });

    // Click the tile itself (not the star) to deselect it.
    fireEvent.click(screen.getByTestId('media-pool-tile-media-1'));
    fireEvent.click(screen.getByText(messages.Commerce.Editor.VariantMedia.save));

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/commerce/products/prod-1/variants/var-1/media', {
        mediaIds: [],
      }),
    );
  });

  it('clearing all selections sends mediaIds: [] to clear the variant override', async () => {
    renderDialog([IMAGE], { selectedMediaIds: ['media-1'], coverMediaId: null });

    fireEvent.click(screen.getByTestId('media-pool-tile-media-1'));
    fireEvent.click(screen.getByText(messages.Commerce.Editor.VariantMedia.save));

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/commerce/products/prod-1/variants/var-1/media', {
        mediaIds: [],
      }),
    );
  });

  it('after a successful save, writes the assignment into the shared SWR cache without a full revalidate', async () => {
    renderDialog([IMAGE]);

    fireEvent.click(screen.getByTestId('media-pool-tile-media-1'));
    fireEvent.click(screen.getByText(messages.Commerce.Editor.VariantMedia.save));

    await waitFor(() => expect(put).toHaveBeenCalled());

    // Same shared key `ProductEditorPage.tsx`/`MediaSection.tsx` use, written with
    // `revalidate: false` (the follow-up plain revalidate is deliberately skipped — see the
    // code comment on why the GET response can't supply this field yet).
    expect(mutateMock).toHaveBeenCalledWith('/commerce/products/prod-1', expect.any(Function), {
      revalidate: false,
    });
    expect(mutateMock).not.toHaveBeenCalledWith('/commerce/products/prod-1');
  });

  it('shows the empty-pool message when the product has no media yet', () => {
    renderDialog([]);
    expect(screen.getByText(messages.Commerce.Editor.VariantMedia.emptyPool)).toBeInTheDocument();
  });
});

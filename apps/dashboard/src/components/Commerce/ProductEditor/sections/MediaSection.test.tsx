import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { EditorMedia } from '../productEditor.schema';
import { dragEndRef } from '../testUtils/dndKitTestMocks';

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
    (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver ||
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

import { MediaSection } from './MediaSection';

const media: EditorMedia[] = [
  { id: 'a', name: 'a.png', url: 'blob:a', type: 'image', isPending: false },
  { id: 'b', name: 'b.png', url: 'blob:b', type: 'image', isPending: false },
];

function renderSection(overrides: Partial<React.ComponentProps<typeof MediaSection>> = {}) {
  return render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <MediaSection
        media={media}
        isBusy={false}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onReorder={vi.fn()}
        {...overrides}
      />
    </NextIntlClientProvider>,
  );
}

describe('MediaSection drag-and-drop reorder', () => {
  it('calls onReorder with the swapped order when a tile is dropped on another', () => {
    const onReorder = vi.fn();
    renderSection({ onReorder });

    dragEndRef.current?.({ active: { id: 'b' }, over: { id: 'a' } });

    expect(onReorder).toHaveBeenCalledWith([media[1], media[0]]);
  });

  it('does not call onReorder when a tile is dropped on itself', () => {
    const onReorder = vi.fn();
    renderSection({ onReorder });

    dragEndRef.current?.({ active: { id: 'a' }, over: { id: 'a' } });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it('still renders the remove button and the cover badge unaffected', () => {
    renderSection();

    expect(screen.getByTestId('media-remove-a')).toBeInTheDocument();
    expect(screen.getByText(messages.Commerce.Editor.Media.cover)).toBeInTheDocument();
  });
});

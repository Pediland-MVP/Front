import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import { EditorTopBar } from './EditorTopBar';

const copy = messages.Commerce.Editor.TopBar;

const renderBar = (props: Partial<React.ComponentProps<typeof EditorTopBar>> = {}) =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <EditorTopBar
        mode="create"
        title="کفش رانینگ"
        unpricedCount={0}
        isSaving={false}
        canSubmit
        onPreview={vi.fn()}
        onRevert={vi.fn()}
        onSave={vi.fn()}
        {...props}
      />
    </NextIntlClientProvider>,
  );

describe('EditorTopBar readiness pill', () => {
  it('reports the missing title first, even when variations are also unpriced', () => {
    renderBar({ title: '   ', unpricedCount: 3 });

    expect(screen.getByTestId('editor-status-pill')).toHaveTextContent(copy.statusNoTitle);
  });

  it('counts the unpriced variations in Persian digits', () => {
    renderBar({ unpricedCount: 3 });

    expect(screen.getByTestId('editor-status-pill')).toHaveTextContent(
      copy.statusNoPrice.replace('{count}', '۳'),
    );
  });

  it('reports ready once there is a title and every variation has a price', () => {
    renderBar({ unpricedCount: 0 });

    expect(screen.getByTestId('editor-status-pill')).toHaveTextContent(copy.statusReady);
  });

  it('falls back to the untitled label rather than rendering an empty heading', () => {
    renderBar({ title: '' });

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(copy.untitled);
  });

  it('blocks save while a save is already in flight', () => {
    renderBar({ isSaving: true });

    expect(screen.getByTestId('editor-save')).toBeDisabled();
  });
});

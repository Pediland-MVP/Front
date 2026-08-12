import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpMeDialog } from '../HelpMeDialog';

const translations: Record<string, string> = {
  triggerText: '(راهنما)',
  close: 'بستن',
};

const translate = (key: string) => translations[key] || '';

vi.mock('next-intl', () => ({
  useTranslations: () => translate,
}));

// HelpMeDialog fetches `/guides/:helpId` via SWR whenever `helpId` is passed. None of
// these tests pass `helpId`, so `useSWR`'s key is `null` and it never fetches — no mock
// needed for `fetcher`/`swr` itself.

describe('HelpMeDialog', () => {
  it('opens the dialog, shows a top close (X) button, and no longer shows a bottom "بستن" button', () => {
    render(<HelpMeDialog title="عنوان راهنما" videoSrc="https://example.com/v.mp4" />);

    fireEvent.click(screen.getByText('(راهنما)'));

    expect(screen.getByText('عنوان راهنما')).toBeInTheDocument();
    // The old bottom close button is gone.
    expect(screen.queryByText('بستن')).not.toBeInTheDocument();
    // A close control is present (Radix DialogClose renders a real button).
    expect(screen.getByRole('button', { name: 'بستن' })).toBeInTheDocument();
  });

  it('closes the dialog when the top close (X) button is clicked', () => {
    render(<HelpMeDialog title="عنوان راهنما" videoSrc="https://example.com/v.mp4" />);

    fireEvent.click(screen.getByText('(راهنما)'));
    expect(screen.getByText('عنوان راهنما')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'بستن' }));
    expect(screen.queryByText('عنوان راهنما')).not.toBeInTheDocument();
  });

  it('renders the video with playsInline so iOS Safari does not auto-fullscreen it', () => {
    render(<HelpMeDialog title="عنوان راهنما" videoSrc="https://example.com/v.mp4" />);

    fireEvent.click(screen.getByText('(راهنما)'));

    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute('playsinline');
  });

  it('renders with no videoSrc at all (a brand-new, CMS-only guide with nothing hardcoded)', () => {
    render(<HelpMeDialog title="راهنمای جدید" />);

    fireEvent.click(screen.getByText('(راهنما)'));

    expect(screen.getByText('راهنمای جدید')).toBeInTheDocument();
    expect(document.querySelector('video')).toBeNull();
  });
});

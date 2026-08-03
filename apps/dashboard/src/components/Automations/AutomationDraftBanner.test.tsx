import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';
import { AutomationDraftBanner } from './AutomationDraftBanner';

function renderBanner(props: Partial<React.ComponentProps<typeof AutomationDraftBanner>> = {}) {
  const defaultProps = {
    onResume: vi.fn(),
    onCreateNew: vi.fn(),
  };
  const merged = { ...defaultProps, ...props };
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <AutomationDraftBanner {...merged} />
    </NextIntlClientProvider>,
  );
  return merged;
}

describe('AutomationDraftBanner', () => {
  it('renders the draft-restored copy', () => {
    renderBanner();
    expect(screen.getByText(messages.Automations.DraftBanner.description)).toBeInTheDocument();
  });

  it('calls onResume when "ادامه ویرایش" is clicked', () => {
    const props = renderBanner();
    fireEvent.click(screen.getByText(messages.Automations.DraftBanner.resume));
    expect(props.onResume).toHaveBeenCalledTimes(1);
    expect(props.onCreateNew).not.toHaveBeenCalled();
  });

  it('calls onCreateNew when "پیام جدید" is clicked', () => {
    const props = renderBanner();
    fireEvent.click(screen.getByText(messages.Automations.DraftBanner.createNew));
    expect(props.onCreateNew).toHaveBeenCalledTimes(1);
    expect(props.onResume).not.toHaveBeenCalled();
  });
});

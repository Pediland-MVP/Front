import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';
import { AutomationDraftDialog } from './AutomationDraftDialog';

function renderDialog(props: Partial<React.ComponentProps<typeof AutomationDraftDialog>> = {}) {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onCreateNew: vi.fn(),
    onResume: vi.fn(),
  };
  const merged = { ...defaultProps, ...props };
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <AutomationDraftDialog {...merged} />
    </NextIntlClientProvider>,
  );
  return merged;
}

describe('AutomationDraftDialog', () => {
  it('renders the draft prompt copy when open', () => {
    renderDialog();
    expect(screen.getByText(messages.Automations.DraftDialog.description)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderDialog({ isOpen: false });
    expect(
      screen.queryByText(messages.Automations.DraftDialog.description),
    ).not.toBeInTheDocument();
  });

  it('calls onCreateNew when "ساخت اتومیشن جدید" is clicked', () => {
    const props = renderDialog();
    fireEvent.click(screen.getByText(messages.Automations.DraftDialog.createNew));
    expect(props.onCreateNew).toHaveBeenCalledTimes(1);
    expect(props.onResume).not.toHaveBeenCalled();
  });

  it('calls onResume when "ادامه قبلی" is clicked', () => {
    const props = renderDialog();
    fireEvent.click(screen.getByText(messages.Automations.DraftDialog.resume));
    expect(props.onResume).toHaveBeenCalledTimes(1);
    expect(props.onCreateNew).not.toHaveBeenCalled();
  });

  it('renders the resume button with the ghost variant', () => {
    renderDialog();
    const resumeButton = screen.getByText(messages.Automations.DraftDialog.resume);
    expect(resumeButton.className).toContain('hover:bg-accent');
  });
});

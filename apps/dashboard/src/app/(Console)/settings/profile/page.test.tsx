import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/fa.json';

vi.mock('@/components/Settings/ProfileForm', () => ({
  ProfileForm: () => <div>profile-form</div>,
}));
vi.mock('@/components/Settings/PasswordTab', () => ({
  PasswordTab: () => <div>password-tab</div>,
}));
vi.mock('@/components/Settings/AccountSessions/AccountSessionsTab', () => ({
  AccountSessionsTab: () => <div>sessions-tab</div>,
}));

import Page from './page';

const renderPage = () =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <Page />
    </NextIntlClientProvider>,
  );

describe('Settings › Profile — tabs', () => {
  it('shows the profile tab by default', () => {
    renderPage();
    expect(screen.getByText('profile-form')).toBeInTheDocument();
    expect(screen.queryByText('password-tab')).not.toBeInTheDocument();
  });

  it('switches to the password tab', () => {
    renderPage();
    // Radix's TabsTrigger activates on `mousedown` (see @radix-ui/react-tabs),
    // not on `click` — jsdom's fireEvent.click dispatches only a bare `click`
    // event with no preceding `mousedown`/focus, so it never reaches Radix's
    // activation handler. fireEvent.mouseDown exercises the same trigger the
    // way a real click does.
    fireEvent.mouseDown(screen.getByRole('tab', { name: messages.Settings.Profile.tab_password }));
    expect(screen.getByText('password-tab')).toBeInTheDocument();
  });

  it('switches to the sessions tab', () => {
    renderPage();
    fireEvent.mouseDown(screen.getByRole('tab', { name: messages.Settings.Profile.tab_sessions }));
    expect(screen.getByText('sessions-tab')).toBeInTheDocument();
  });
});

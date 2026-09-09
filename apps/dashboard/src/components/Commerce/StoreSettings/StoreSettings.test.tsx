import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import type { CommerceStoreSettings } from '@/types/commerce';

const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(true) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: mockCan }),
}));

const { save, mutate } = vi.hoisted(() => ({
  save: vi.fn(),
  mutate: vi.fn(),
}));
let settings: CommerceStoreSettings | null = null;
let isLoading = false;
vi.mock('@/hooks/useStoreSettings', () => ({
  useStoreSettings: () => ({ settings, isLoading, error: undefined, mutate, save }),
}));

const { toastError, toastSuccess } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: toastError, success: toastSuccess } }));

import { StoreSettings } from './StoreSettings';

const copy = messages.Commerce.StoreSettings;

const renderScreen = () =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <StoreSettings />
    </NextIntlClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockCan.mockReturnValue(true);
  settings = null;
  isLoading = false;
  save.mockResolvedValue({
    data: { message: 'Updated', statusCode: 200, code: 'COMMERCE_STORE_SETTINGS_SAVED', data: {} },
  });
});

describe('StoreSettings', () => {
  it('renders blank when the workspace has no saved default', () => {
    renderScreen();
    expect(screen.getByLabelText(copy.defaultFinalMessageLabel)).toHaveValue('');
  });

  it('loads the saved default into the field', () => {
    settings = { defaultFinalMessage: 'ممنون از خرید شما' };
    renderScreen();
    expect(screen.getByLabelText(copy.defaultFinalMessageLabel)).toHaveValue('ممنون از خرید شما');
  });

  it('saves the trimmed message and shows a success toast', async () => {
    renderScreen();
    fireEvent.change(screen.getByLabelText(copy.defaultFinalMessageLabel), {
      target: { value: '  سلام دوست عزیز  ' },
    });

    fireEvent.click(screen.getByText(copy.save).closest('button')!);

    await waitFor(() => expect(save).toHaveBeenCalledWith('سلام دوست عزیز'));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith(copy.saved));
  });

  it('saves null when the field is cleared, instead of an empty string', async () => {
    settings = { defaultFinalMessage: 'قبلی' };
    renderScreen();
    fireEvent.change(screen.getByLabelText(copy.defaultFinalMessageLabel), {
      target: { value: '' },
    });

    fireEvent.click(screen.getByText(copy.save).closest('button')!);

    await waitFor(() => expect(save).toHaveBeenCalledWith(null));
  });

  it('disables the field and save button without product:edit', () => {
    mockCan.mockReturnValue(false);
    renderScreen();

    expect(screen.getByLabelText(copy.defaultFinalMessageLabel)).toBeDisabled();
    expect(screen.getByText(copy.save).closest('button')).toBeDisabled();
  });

  it('shows a translated error toast for a coded save failure', async () => {
    save.mockRejectedValue({
      response: { data: { code: 'COMMERCE_STORE_SETTINGS_INVALID' } },
    });
    renderScreen();

    fireEvent.click(screen.getByText(copy.save).closest('button')!);

    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});

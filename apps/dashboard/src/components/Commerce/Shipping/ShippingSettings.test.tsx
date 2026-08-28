import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messages from '@/messages/fa.json';
import { useHeaderFeatures } from '@/lib/stores/useHeaderFeaturesStore';
import type { CommerceShippingOption } from '@/types/shipping';

import { ShippingSettings } from './ShippingSettings';

const copy = messages.Commerce.Shipping;

const createOption = vi.fn();
const updateOption = vi.fn();
const deleteOption = vi.fn();
const setOverrides = vi.fn();
const mutate = vi.fn();
let serverOptions: CommerceShippingOption[] = [];

vi.mock('@/hooks/useShippingOptions', () => ({
  shippingOptionsKey: '/commerce/shipping-options',
  useShippingOptions: () => ({
    options: serverOptions,
    isLoading: false,
    error: undefined,
    mutate,
    createOption,
    updateOption,
    deleteOption,
    setOverrides,
  }),
}));

vi.mock('@/hooks/useShippingDestinations', () => ({
  useShippingDestinations: () => ({
    provinces: [],
    cities: [],
    provinceById: new Map(),
    cityById: new Map(),
    isLoading: false,
  }),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => true }),
}));

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (m: string) => toastError(m), success: (m: string) => toastSuccess(m) },
}));

const option = (patch: Partial<CommerceShippingOption> = {}): CommerceShippingOption => ({
  id: 'opt-1',
  workspaceId: 'ws-1',
  kind: 'post_express',
  title: 'پست پیشتاز',
  settlement: 'prepaid',
  amount: 45000,
  freeOverAmount: null,
  sortOrder: 0,
  isActive: true,
  overrides: [],
  createDate: '2026-08-27T00:00:00.000Z',
  updateDate: '2026-08-27T00:00:00.000Z',
  ...patch,
});

/** Renders the screen together with the header slot its save/cancel buttons are teleported into. */
const Harness = () => {
  const buttons = useHeaderFeatures((s) => s.buttons);
  return (
    <NextIntlClientProvider locale="fa" messages={messages}>
      <div>{buttons}</div>
      <ShippingSettings />
    </NextIntlClientProvider>
  );
};

const renderScreen = () => render(<Harness />);
const saveButton = () => screen.getByRole('button', { name: copy.save });

beforeEach(() => {
  vi.clearAllMocks();
  useHeaderFeatures.getState().reset();
  serverOptions = [option()];
});

describe('ShippingSettings — nothing is sent until save', () => {
  it('leaves save disabled while the screen matches the server', () => {
    renderScreen();

    expect(saveButton()).toBeDisabled();
  });

  it('enables save once something actually changed', () => {
    renderScreen();

    fireEvent.change(screen.getByLabelText(copy.priceLabel), { target: { value: '50000' } });

    expect(saveButton()).toBeEnabled();
  });

  it('sends no request while the merchant is still typing', () => {
    renderScreen();

    fireEvent.change(screen.getByLabelText(copy.priceLabel), { target: { value: '50000' } });

    expect(updateOption).not.toHaveBeenCalled();
    expect(setOverrides).not.toHaveBeenCalled();
  });

  it('restores the server values when the edit is cancelled', () => {
    renderScreen();

    fireEvent.change(screen.getByLabelText(copy.priceLabel), { target: { value: '50000' } });
    fireEvent.click(screen.getByRole('button', { name: copy.cancel }));

    expect(screen.getByLabelText(copy.priceLabel)).toHaveValue('۴۵٬۰۰۰');
    expect(saveButton()).toBeDisabled();
  });
});

describe('ShippingSettings — what save actually writes', () => {
  it('patches only the option that changed', async () => {
    serverOptions = [option(), option({ id: 'opt-2', title: 'تیپاکس', kind: 'tipax' })];
    renderScreen();

    fireEvent.change(screen.getAllByLabelText(copy.priceLabel)[0], { target: { value: '50000' } });
    fireEvent.click(saveButton());

    await waitFor(() => expect(updateOption).toHaveBeenCalledTimes(1));
    expect(updateOption).toHaveBeenCalledWith('opt-1', expect.objectContaining({ amount: 50000 }));
  });

  it('does not rewrite the exceptions of an option whose exceptions did not move', async () => {
    renderScreen();

    fireEvent.change(screen.getByLabelText(copy.priceLabel), { target: { value: '50000' } });
    fireEvent.click(saveButton());

    await waitFor(() => expect(updateOption).toHaveBeenCalled());
    expect(setOverrides).not.toHaveBeenCalled();
  });

  it('creates a brand-new method, then attaches its exceptions to the id the server gave back', async () => {
    createOption.mockResolvedValue({ data: { data: { id: 'new-id' } } });
    renderScreen();

    fireEvent.click(screen.getByRole('button', { name: new RegExp(copy.addMethod) }));
    const titles = screen.getAllByLabelText(copy.titleLabel);
    fireEvent.change(titles[titles.length - 1], { target: { value: 'پیک موتوری' } });
    fireEvent.click(saveButton());

    await waitFor(() => expect(createOption).toHaveBeenCalledTimes(1));
    expect(createOption).toHaveBeenCalledWith(expect.objectContaining({ title: 'پیک موتوری' }));
    // No exceptions were added, so there is nothing to attach.
    expect(setOverrides).not.toHaveBeenCalled();
  });

  it('refuses to save a method with no name, before any request goes out', async () => {
    renderScreen();

    fireEvent.change(screen.getByLabelText(copy.titleLabel), { target: { value: '   ' } });
    fireEvent.click(saveButton());

    await waitFor(() => expect(toastError).toHaveBeenCalledWith(copy.titleRequired));
    expect(updateOption).not.toHaveBeenCalled();
  });

  it('switching to a carrier-collected mode clears the saved exceptions', async () => {
    serverOptions = [
      option({
        overrides: [
          { id: 'o1', shippingOptionId: 'opt-1', cityId: 20, provinceId: null, amount: 110000 },
        ],
      }),
    ];
    renderScreen();

    fireEvent.click(screen.getByRole('radio', { name: copy.settlements.freight_collect }));
    fireEvent.click(saveButton());

    await waitFor(() => expect(setOverrides).toHaveBeenCalledWith('opt-1', { overrides: [] }));
    expect(updateOption).toHaveBeenCalledWith(
      'opt-1',
      expect.objectContaining({ settlement: 'freight_collect', amount: 0, freeOverAmount: null }),
    );
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import faMessages from '@/messages/fa.json';
import errorCodes from '@/messages/fa/ErrorCodes.json';

// Mirrors i18n/request.ts's merge: fa.json's own `ERROR_CODES` block is dead (shadowed by that
// shallow spread) — the real translations for `t_ec` come from fa/ErrorCodes.json.
const messages = { ...faMessages, ...errorCodes };
const copy = messages.Settings.ShopAddress;

// Radix's Select never opens under jsdom (it needs pointer capture + layout). Swap in a native
// <select> so the province/city fields render and can be driven with fireEvent.change, same
// idiom the deleted ShopAddressDialog.test.tsx used for the same reason.
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, disabled, children }: any) => (
    <select
      data-value={value ?? ''}
      disabled={disabled}
      value={value ?? ''}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="" />
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

let addressData: any = undefined; // undefined = still loading
const saveMock = vi.fn();
const mutateMock = vi.fn();
vi.mock('@/hooks/useShopAddress', () => ({
  useShopAddress: () => ({
    address: addressData,
    isLoading: addressData === undefined,
    error: undefined,
    mutate: mutateMock,
    save: saveMock,
  }),
}));

const PROVINCES = [
  { id: 1, name: 'استان آ', slug: 'a', tel_prefix: '021' },
  { id: 2, name: 'استان ب', slug: 'b', tel_prefix: '031' },
];
const CITIES = [
  { id: 5, name: 'شهر آ', slug: 'a', provinceId: 1 },
  { id: 6, name: 'شهر ب', slug: 'b', provinceId: 2 },
];
vi.mock('@/hooks/useShippingDestinations', () => ({
  useShippingDestinations: () => ({
    provinces: PROVINCES,
    cities: CITIES,
    provinceById: new Map(PROVINCES.map((p) => [p.id, p])),
    cityById: new Map(CITIES.map((c) => [c.id, c])),
    isLoading: false,
  }),
}));

let canManage = true;
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => canManage }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ShopAddressSettings } from './ShopAddressSettings';
import { toast } from 'sonner';

const renderScreen = () =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <ShopAddressSettings />
    </NextIntlClientProvider>,
  );

const selects = () => document.body.querySelectorAll('select');
const saveButton = () => screen.getByText(copy.save).closest('button')!;

beforeEach(() => {
  addressData = null;
  canManage = true;
  saveMock.mockReset().mockResolvedValue({
    data: { message: 'Updated', statusCode: 200, code: 'SHOP_ADDRESS_UPDATED', data: null },
  });
  mutateMock.mockReset();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

describe('ShopAddressSettings', () => {
  it('renders blank fields when the workspace has no saved address', async () => {
    addressData = null;
    renderScreen();

    await waitFor(() => expect(screen.getByLabelText(copy.address)).toHaveValue(''));
    expect(screen.getByLabelText(copy.postalCode)).toHaveValue('');
    expect(screen.getByLabelText(copy.phone)).toHaveValue('');
    expect(selects()[0]).toHaveAttribute('data-value', '');
    expect(selects()[1]).toHaveAttribute('data-value', '');
  });

  it('renders the saved address, resolving the state Select from city.province', async () => {
    addressData = {
      address: 'خیابان آزادی، پلاک ۱',
      postalcode: '1111111111',
      phone: '09111111111',
      shippingMethod: 'پست',
      city: { id: 5, name: 'شهر آ', province: { id: 1, name: 'استان آ' } },
    };
    renderScreen();

    await waitFor(() =>
      expect(screen.getByLabelText(copy.address)).toHaveValue('خیابان آزادی، پلاک ۱'),
    );
    expect(screen.getByLabelText(copy.postalCode)).toHaveValue('1111111111');
    expect(screen.getByLabelText(copy.phone)).toHaveValue('09111111111');
    expect(selects()[0]).toHaveAttribute('data-value', '1'); // state <- city.province.id
    expect(selects()[1]).toHaveAttribute('data-value', '5'); // cityId <- city.id
  });

  // Regression guard: react-hook-form's reset()/setValue() do not reliably clear a
  // manually-controlled Controller-bound Select's DISPLAYED value when given an explicit
  // `undefined` — the fix is resetting/clearing to `''` instead. Ported from the deleted
  // ShopAddressDialog.test.tsx's equivalent cases, now covering the single-workspace form.
  it('clears the stale cityId (visually and in the submitted payload) when a different province is picked', async () => {
    addressData = {
      address: 'آدرس',
      postalcode: '1111111111',
      phone: '09111111111',
      shippingMethod: null,
      city: { id: 5, name: 'شهر آ', province: { id: 1, name: 'استان آ' } },
    };
    renderScreen();

    await waitFor(() => expect(selects()[0]).toHaveAttribute('data-value', '1'));
    expect(selects()[1]).toHaveAttribute('data-value', '5');

    fireEvent.change(selects()[0], { target: { value: '2' } });

    await waitFor(() => expect(selects()[0]).toHaveAttribute('data-value', '2'));
    expect(selects()[1]).toHaveAttribute('data-value', '');

    saveButton().click();

    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    expect(saveMock.mock.calls[0][0].cityId).toBeUndefined();
  });

  it('disables every field, not just the save button, when the user cannot manage orders', async () => {
    addressData = { address: 'a', postalcode: null, phone: null, shippingMethod: null, city: null };
    canManage = false;
    renderScreen();

    await waitFor(() => expect(screen.getByLabelText(copy.address)).toBeDisabled());
    expect(screen.getByLabelText(copy.postalCode)).toBeDisabled();
    expect(screen.getByLabelText(copy.phone)).toBeDisabled();
    expect(selects()[0]).toBeDisabled();
    expect(selects()[1]).toBeDisabled();
    expect(saveButton()).toBeDisabled();
  });

  it('leaves fields enabled when the user can manage orders', async () => {
    // cityId is additionally disabled until a province is picked (independent of canManage), so
    // a saved city/province is used here to exercise the "enabled" case for both Selects.
    addressData = {
      address: 'a',
      postalcode: null,
      phone: null,
      shippingMethod: null,
      city: { id: 5, name: 'شهر آ', province: { id: 1, name: 'استان آ' } },
    };
    renderScreen();

    await waitFor(() => expect(screen.getByLabelText(copy.address)).not.toBeDisabled());
    expect(selects()[0]).not.toBeDisabled();
    expect(selects()[1]).not.toBeDisabled();
  });

  it('saves successfully and shows a success toast', async () => {
    addressData = null;
    renderScreen();

    await waitFor(() => expect(screen.getByLabelText(copy.address)).toHaveValue(''));
    fireEvent.change(screen.getByLabelText(copy.address), { target: { value: 'آدرس جدید' } });

    saveButton().click();

    await waitFor(() =>
      expect(saveMock).toHaveBeenCalledWith(expect.objectContaining({ address: 'آدرس جدید' })),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(copy.saved));
  });

  it('writes the PUT response straight into the SWR cache (revalidate: false), no extra refetch', async () => {
    const savedRow = {
      address: 'آدرس جدید',
      postalcode: '1111111111',
      phone: '09111111111',
      shippingMethod: 'پست',
      city: { id: 5, name: 'شهر', province: { id: 1, name: 'استان' } },
    };
    const responseBody = {
      message: 'Updated',
      statusCode: 200,
      code: 'SHOP_ADDRESS_UPDATED',
      data: savedRow,
    };
    saveMock.mockResolvedValue({ data: responseBody });
    addressData = null;
    renderScreen();

    await waitFor(() => expect(screen.getByLabelText(copy.address)).toHaveValue(''));
    saveButton().click();

    await waitFor(() =>
      expect(mutateMock).toHaveBeenCalledWith(responseBody, { revalidate: false }),
    );
  });

  it('shows the translated error message for a coded save failure', async () => {
    addressData = null;
    saveMock.mockRejectedValue({
      response: { data: { code: 'SHOP_ADDRESS_INVALID_CITY', message: 'invalid city' } },
    });
    renderScreen();

    await waitFor(() => expect(screen.getByLabelText(copy.address)).toHaveValue(''));
    saveButton().click();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(messages.ERROR_CODES.SHOP_ADDRESS_INVALID_CITY),
    );
  });
});

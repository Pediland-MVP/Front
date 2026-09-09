import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import faMessages from '@/messages/fa.json';
import errorCodes from '@/messages/fa/ErrorCodes.json';

// Mirrors i18n/request.ts's merge: fa.json's own `ERROR_CODES` block is dead (shadowed by
// this shallow spread) — the real translations for `t_ec` come from fa/ErrorCodes.json.
const messages = { ...faMessages, ...errorCodes };

const putMock = vi.fn();
vi.mock('@/hooks/swr/api-client', () => ({
  default: { put: (...args: unknown[]) => putMock(...args) },
}));

vi.mock('swr', () => ({ mutate: vi.fn() }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Radix's Select never opens under jsdom (it needs pointer capture + layout). Swap in a
// native <select> so the province/city fields render without blowing up.
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, disabled, children }: any) => (
    <select disabled={disabled} value={value ?? ''} onChange={(e) => onValueChange(e.target.value)}>
      <option value="" />
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

// Keyed by SWR key so each account's GET response can be driven independently. A key
// absent from the map behaves like a request that hasn't resolved yet (data: undefined)
// — distinct from a key present with `data: null`, which is what a real account with no
// saved address returns.
let swrResponses: Record<string, any> = {};
vi.mock('swr/immutable', () => ({
  default: (key: string | null) =>
    key ? (swrResponses[key] ?? { data: undefined }) : { data: undefined },
}));

import { ShopAddressDialog } from './ShopAddressDialog';
import { toast } from 'sonner';

const copy = messages.Settings.ShopAddress;

const shopAddressKey = (instagramId: string) => `/instagram/${instagramId}/shopAddress`;

const mockShopAddress = (instagramId: string, address: Record<string, unknown> | null) => {
  swrResponses[shopAddressKey(instagramId)] = {
    data: { message: 'OK', statusCode: 200, code: 'SHOP_ADDRESS_READ', data: address },
  };
};

const renderDialog = (instagramId: string, canManage = true) =>
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <ShopAddressDialog
        instagramId={instagramId}
        open
        onOpenChange={() => {}}
        canManage={canManage}
      />
    </NextIntlClientProvider>,
  );

const rerenderDialog = (
  rerender: (ui: React.ReactElement) => void,
  instagramId: string,
  canManage = true,
) =>
  rerender(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <ShopAddressDialog
        instagramId={instagramId}
        open
        onOpenChange={() => {}}
        canManage={canManage}
      />
    </NextIntlClientProvider>,
  );

describe('ShopAddressDialog', () => {
  beforeEach(() => {
    swrResponses = {};
    putMock.mockReset().mockResolvedValue({});
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("renders empty fields for an account whose GET resolves data: null, instead of leaking the previously viewed account's values", async () => {
    mockShopAddress('ig-a', {
      id: 'sa-a',
      address: 'خیابان آزادی، پلاک ۱',
      postalcode: '1111111111',
      phone: '09111111111',
      shippingMethod: 'پست',
      city: null,
    });
    const { rerender } = renderDialog('ig-a');

    await waitFor(() =>
      expect(screen.getByLabelText(copy.address)).toHaveValue('خیابان آزادی، پلاک ۱'),
    );
    expect(screen.getByLabelText(copy.postalCode)).toHaveValue('1111111111');
    expect(screen.getByLabelText(copy.phone)).toHaveValue('09111111111');

    // Account B has never had an address saved — the real API resolves this as
    // `data: null`, not `undefined`. That must render blank fields, not A's values.
    mockShopAddress('ig-b', null);
    rerenderDialog(rerender, 'ig-b');

    await waitFor(() => expect(screen.getByLabelText(copy.address)).toHaveValue(''));
    expect(screen.getByLabelText(copy.postalCode)).toHaveValue('');
    expect(screen.getByLabelText(copy.phone)).toHaveValue('');
  });

  it('swaps the displayed values when instagramId changes between two accounts with different saved addresses', async () => {
    mockShopAddress('ig-a', {
      id: 'sa-a',
      address: 'آدرس حساب آ',
      postalcode: '1111111111',
      phone: '09111111111',
      shippingMethod: null,
      city: null,
    });
    mockShopAddress('ig-b', {
      id: 'sa-b',
      address: 'آدرس حساب ب',
      postalcode: '2222222222',
      phone: '09222222222',
      shippingMethod: null,
      city: null,
    });

    const { rerender } = renderDialog('ig-a');
    await waitFor(() => expect(screen.getByLabelText(copy.address)).toHaveValue('آدرس حساب آ'));
    expect(screen.getByLabelText(copy.postalCode)).toHaveValue('1111111111');
    expect(screen.getByLabelText(copy.phone)).toHaveValue('09111111111');

    rerenderDialog(rerender, 'ig-b');

    await waitFor(() => expect(screen.getByLabelText(copy.address)).toHaveValue('آدرس حساب ب'));
    expect(screen.getByLabelText(copy.postalCode)).toHaveValue('2222222222');
    expect(screen.getByLabelText(copy.phone)).toHaveValue('09222222222');
  });

  it('disables every field (not just the save button) when canManage is false, so read-only is actually read-only, while the trigger stays out of scope of this dialog', () => {
    mockShopAddress('ig-a', {
      id: 'sa-a',
      address: 'آدرس',
      postalcode: '1111111111',
      phone: '09111111111',
      shippingMethod: null,
      city: null,
    });
    renderDialog('ig-a', false);

    expect(screen.getByLabelText(copy.address)).toBeDisabled();
    expect(screen.getByLabelText(copy.postalCode)).toBeDisabled();
    expect(screen.getByLabelText(copy.phone)).toBeDisabled();
    expect(screen.getByText(copy.save).closest('button')).toBeDisabled();
  });

  it('saves successfully and shows a success toast', async () => {
    mockShopAddress('ig-a', null);
    renderDialog('ig-a');

    await waitFor(() => expect(screen.getByLabelText(copy.address)).toHaveValue(''));

    screen.getByText(copy.save).closest('button')!.click();

    await waitFor(() =>
      expect(putMock).toHaveBeenCalledWith('/instagram/ig-a/shopAddress', expect.any(Object)),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(copy.saved));
  });

  it('shows the translated error message for a coded save failure', async () => {
    mockShopAddress('ig-a', null);
    putMock.mockRejectedValue({
      response: { data: { code: 'SHOP_ADDRESS_INVALID_CITY', message: 'invalid city' } },
    });
    renderDialog('ig-a');

    await waitFor(() => expect(screen.getByLabelText(copy.address)).toHaveValue(''));

    screen.getByText(copy.save).closest('button')!.click();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(messages.ERROR_CODES.SHOP_ADDRESS_INVALID_CITY),
    );
  });
});

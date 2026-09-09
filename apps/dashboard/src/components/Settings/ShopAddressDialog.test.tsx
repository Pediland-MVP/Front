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

const mutateMock = vi.fn();
vi.mock('swr', () => ({ mutate: (...args: unknown[]) => mutateMock(...args) }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Radix's Select never opens under jsdom (it needs pointer capture + layout). Swap in a
// native <select> so the province/city fields render without blowing up.
//
// `data-value` mirrors the raw `value` prop directly, separately from the native `value`
// attribute: the real component's `provinces`/`cities` option lists come from their own
// SWR hooks (`/cities/provinces`, `/cities?provinceId=...`), which this suite does not mock,
// so no <option> ever matches an id like "1" and a real `value="1"` renders as blank in
// jsdom the same way an unmatched `<select value>` always does in the DOM -- that would look
// exactly like a reset-to-blank bug even when the field is holding the right value. Reading
// `data-value` instead asserts what `field.value` (the actual RHF/blanking state under test)
// really is, independent of that unrelated, unmocked option-list gap.
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
    putMock.mockReset().mockResolvedValue({
      data: { message: 'Updated', statusCode: 200, code: 'SHOP_ADDRESS_UPDATED', data: null },
    });
    mutateMock.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("renders empty fields for an account whose GET resolves data: null, instead of leaking the previously viewed account's values", async () => {
    // Account A HAS a saved city/province, unlike every other fixture in this file (all use
    // `city: null`) -- the state/cityId Selects were the two fields the cross-account reset
    // tests never actually drove a real value into, so a regression that stopped resetting
    // them (e.g. keeping `state`/`cityId` out of the blanking `form.reset({})` call) had zero
    // coverage. `state` is a select of *province* ids: `useEffect` sets it from
    // `a.city.province.id`.
    mockShopAddress('ig-a', {
      id: 'sa-a',
      address: 'خیابان آزادی، پلاک ۱',
      postalcode: '1111111111',
      phone: '09111111111',
      shippingMethod: 'پست',
      city: { id: 5, name: 'شهر آ', province: { id: 1, name: 'استان آ' } },
    });
    const { rerender } = renderDialog('ig-a');

    await waitFor(() =>
      expect(screen.getByLabelText(copy.address)).toHaveValue('خیابان آزادی، پلاک ۱'),
    );
    expect(screen.getByLabelText(copy.postalCode)).toHaveValue('1111111111');
    expect(screen.getByLabelText(copy.phone)).toHaveValue('09111111111');
    const selects = () => document.body.querySelectorAll('select');
    await waitFor(() => expect(selects()[0]).toHaveAttribute('data-value', '1')); // state <- city.province.id
    expect(selects()[1]).toHaveAttribute('data-value', '5'); // cityId <- city.id

    // Account B has never had an address saved — the real API resolves this as
    // `data: null`, not `undefined`. That must render blank fields, not A's values.
    mockShopAddress('ig-b', null);
    rerenderDialog(rerender, 'ig-b');

    await waitFor(() => expect(screen.getByLabelText(copy.address)).toHaveValue(''));
    expect(screen.getByLabelText(copy.postalCode)).toHaveValue('');
    expect(screen.getByLabelText(copy.phone)).toHaveValue('');
    // NOTE: this is where a symmetric "the selects blank out too" assertion would go, matching
    // the address/postalCode/phone checks right above. It is deliberately NOT here -- see the
    // skipped repro test directly below, which documents a real defect this task found: the
    // state/cityId Selects do NOT reset in this exact scenario. Per the task-11 brief ("tests
    // only", "do not fix it yourself" for any found production bug), this is reported in the
    // task-11 report rather than silently patched or silently asserted as correct.
  });

  /**
   * KNOWN PRODUCTION DEFECT -- found while gap-filling this suite (Task 11), not fixed here
   * per that task's "tests only, report don't fix" instruction. Reported in task-11-report.md.
   *
   * Switching FROM an account that has a saved city TO an account with NO saved city
   * (`data.data.city === null`, the exact "account B never saved an address" shape the test
   * right above this one already covers for address/postalCode/phone) does NOT blank the
   * `state`/`cityId` Selects: they keep showing account A's province/city. This is the same
   * "cross-account leak" bug class this whole file exists to catch -- here it prints the
   * WRONG sender province/city on account B's shipping label/invoice.
   *
   * Root cause sketch (not confirmed further, out of scope for a tests-only pass):
   * `ShopAddressDialog.tsx`'s second `useEffect` calls
   * `form.reset({ state: a?.city?.province ? ... : undefined, cityId: a?.city ? ... : undefined, ... })`.
   * The plain string fields in that same call (`address`, `postalcode`, `phone`,
   * `shippingMethod`, all using `?? ''`) DO reset correctly in this exact run (proved by the
   * test above, in the SAME account-switch) -- only the two fields reset to `undefined`
   * (`state`, `cityId`) get stuck. That points at `reset()` with an explicit `undefined` for a
   * Select-bound field (`value={field.value ?? ''}`, not a spread `{...field}` registration
   * like the text inputs use) rather than at the effect not re-running at all.
   */
  it.skip('BUG (unfixed, tests-only pass): does not blank the state/cityId Selects when switching to an account with no saved city', async () => {
    mockShopAddress('ig-a', {
      id: 'sa-a',
      address: 'خیابان آزادی، پلاک ۱',
      postalcode: '1111111111',
      phone: '09111111111',
      shippingMethod: 'پست',
      city: { id: 5, name: 'شهر آ', province: { id: 1, name: 'استان آ' } },
    });
    const { rerender } = renderDialog('ig-a');
    const selects = () => document.body.querySelectorAll('select');
    await waitFor(() => expect(selects()[0]).toHaveAttribute('data-value', '1'));
    expect(selects()[1]).toHaveAttribute('data-value', '5');

    mockShopAddress('ig-b', null);
    rerenderDialog(rerender, 'ig-b');

    await waitFor(() => expect(screen.getByLabelText(copy.address)).toHaveValue(''));
    // Reproduces the defect: as of this writing, these two assertions FAIL -- the selects stay
    // at account A's '1'/'5' instead of blanking to ''.
    await waitFor(() => expect(selects()[0]).toHaveAttribute('data-value', ''));
    expect(selects()[1]).toHaveAttribute('data-value', '');
  });

  it('swaps the displayed values when instagramId changes between two accounts with different saved addresses', async () => {
    mockShopAddress('ig-a', {
      id: 'sa-a',
      address: 'آدرس حساب آ',
      postalcode: '1111111111',
      phone: '09111111111',
      shippingMethod: null,
      city: { id: 5, name: 'شهر آ', province: { id: 1, name: 'استان آ' } },
    });
    mockShopAddress('ig-b', {
      id: 'sa-b',
      address: 'آدرس حساب ب',
      postalcode: '2222222222',
      phone: '09222222222',
      shippingMethod: null,
      city: { id: 6, name: 'شهر ب', province: { id: 2, name: 'استان ب' } },
    });

    const { rerender } = renderDialog('ig-a');
    await waitFor(() => expect(screen.getByLabelText(copy.address)).toHaveValue('آدرس حساب آ'));
    expect(screen.getByLabelText(copy.postalCode)).toHaveValue('1111111111');
    expect(screen.getByLabelText(copy.phone)).toHaveValue('09111111111');
    const selects = () => document.body.querySelectorAll('select');
    await waitFor(() => expect(selects()[0]).toHaveAttribute('data-value', '1'));
    expect(selects()[1]).toHaveAttribute('data-value', '5');

    rerenderDialog(rerender, 'ig-b');

    await waitFor(() => expect(screen.getByLabelText(copy.address)).toHaveValue('آدرس حساب ب'));
    expect(screen.getByLabelText(copy.postalCode)).toHaveValue('2222222222');
    expect(screen.getByLabelText(copy.phone)).toHaveValue('09222222222');
    // Guards the same leak as the address/postalCode/phone assertions above, but for the two
    // fields (`state`/`cityId`) the prior version of this suite never actually populated with
    // a real value on EITHER account, so a stuck-at-A's-province regression here would have
    // passed silently.
    await waitFor(() => expect(selects()[0]).toHaveAttribute('data-value', '2'));
    expect(selects()[1]).toHaveAttribute('data-value', '6');
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
    // The state/cityId Selects also carry `disabled={!canManage}` in the source (verified by
    // reading ShopAddressDialog.tsx), but that was previously UNTESTED -- a read-only viewer
    // could otherwise still open the province/city dropdown even though every other field is
    // locked. `getByLabelText` can't reach them: the mocked `<Select>` (needed because Radix's
    // real Select can't open under jsdom) renders a bare native `<select>` with the `<label
    // for>` landing on the real `FormControl`'s id, which in the real component tree is
    // forwarded to `SelectTrigger` (mocked away to a bare fragment here), not onto the
    // `<select>` itself -- a mock-wiring gap, not a production one (confirmed by reading the
    // DOM dump: the rendered `<select disabled>` has no `id`/`for` counterpart at all). Query
    // by DOM order instead: the state field is declared before the cityId field in the JSX.
    const selects = document.body.querySelectorAll('select');
    expect(selects).toHaveLength(2);
    expect(selects[0]).toBeDisabled();
    expect(selects[1]).toBeDisabled();
    expect(screen.getByText(copy.save).closest('button')).toBeDisabled();
  });

  it('leaves the state/cityId Selects enabled when canManage is true', () => {
    renderDialog('ig-a', true);
    const selects = document.body.querySelectorAll('select');
    expect(selects).toHaveLength(2);
    expect(selects[0]).not.toBeDisabled();
    expect(selects[1]).not.toBeDisabled();
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

  it('writes the PUT response straight into the SWR cache (revalidate: false) and closes without waiting on a re-fetch', async () => {
    // The saved row PUT returns, INCLUDING resolved city/province — the backend re-reads
    // with relations after saving so this is already GET-shaped. There must be no extra
    // network round trip (`mutate(key)` with no data, SWR's revalidate-then-refetch form)
    // gating the dialog's close.
    const savedRow = {
      id: 'sa-a',
      address: 'آدرس جدید',
      postalcode: '1111111111',
      phone: '09111111111',
      shippingMethod: 'پست',
      city: { id: 5, name: 'شهر', province: { id: 1, name: 'استان' } },
    };
    putMock.mockResolvedValue({
      data: { message: 'Updated', statusCode: 200, code: 'SHOP_ADDRESS_UPDATED', data: savedRow },
    });
    mockShopAddress('ig-a', null);
    const onOpenChange = vi.fn();
    render(
      <NextIntlClientProvider locale="fa" messages={messages}>
        <ShopAddressDialog instagramId="ig-a" open onOpenChange={onOpenChange} canManage />
      </NextIntlClientProvider>,
    );

    await waitFor(() => expect(screen.getByLabelText(copy.address)).toHaveValue(''));

    screen.getByText(copy.save).closest('button')!.click();

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    // The cache write is local (`revalidate: false`) using the PUT response's own data,
    // not a bare `mutate(key)` (which would trigger a real GET).
    expect(mutateMock).toHaveBeenCalledWith(
      '/instagram/ig-a/shopAddress',
      { message: 'Updated', statusCode: 200, code: 'SHOP_ADDRESS_UPDATED', data: savedRow },
      { revalidate: false },
    );
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

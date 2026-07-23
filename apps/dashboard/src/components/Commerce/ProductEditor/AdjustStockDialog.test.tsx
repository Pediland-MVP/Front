import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

// Same convention `VariantMediaPickerDialog.test.tsx` uses: mock the global `mutate` so tests
// can assert on the post-PATCH revalidation call without hitting real SWR/network.
const { mutateMock } = vi.hoisted(() => ({ mutateMock: vi.fn().mockResolvedValue(undefined) }));
vi.mock('swr', () => ({ mutate: mutateMock }));

const { patch } = vi.hoisted(() => ({ patch: vi.fn().mockResolvedValue({ data: {} }) }));
vi.mock('@/hooks/swr/api-client', () => ({ default: { patch } }));

const { toastError, toastSuccess } = vi.hoisted(() => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { error: toastError, success: toastSuccess } }));

// `can` defaults to true (every existing test above assumes full edit permission) — the
// dedicated permission-gating suite below overrides it to false, same mocking convention
// `ProductListPage.test.tsx` uses for `usePermissions`.
const { mockCan } = vi.hoisted(() => ({ mockCan: vi.fn().mockReturnValue(true) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: mockCan }),
}));

import messages from '@/messages/fa.json';
import { AdjustStockDialog } from './AdjustStockDialog';

function renderDialog(currentOnHand = 18, currentLowStockThreshold: number | null = null) {
  const onOpenChange = vi.fn();
  render(
    <NextIntlClientProvider locale="fa" messages={messages}>
      <AdjustStockDialog
        open
        onOpenChange={onOpenChange}
        productId="prod-1"
        variantId="var-1"
        variantLabel="۵۰۰ گرم / بدون جعبه"
        currentOnHand={currentOnHand}
        currentLowStockThreshold={currentLowStockThreshold}
      />
    </NextIntlClientProvider>,
  );
  return { onOpenChange };
}

beforeEach(() => {
  vi.clearAllMocks();
  mutateMock.mockResolvedValue(undefined);
  patch.mockResolvedValue({ data: {} });
  mockCan.mockReset().mockReturnValue(true);
});

describe('AdjustStockDialog', () => {
  it('shows the current stock and defaults the new-stock input to it', () => {
    renderDialog(18);
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByTestId('adjust-stock-new-on-hand')).toHaveValue('18');
  });

  it('submits the PATCH with a single-entry array and the absolute onHand — no reason field', async () => {
    renderDialog(18);

    const input = screen.getByTestId('adjust-stock-new-on-hand');
    fireEvent.change(input, { target: { value: '30' } });
    fireEvent.click(screen.getByText(messages.Commerce.Editor.Inventory.Adjust.submit));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/commerce/products/prod-1/stock', [
        { variantId: 'var-1', onHand: 30 },
      ]),
    );
  });

  it('the "increase" delta toggle computes the new-stock preview but only the final onHand is sent', async () => {
    renderDialog(18);

    const deltaInputs = screen.getAllByPlaceholderText('۰');
    // First numeric input is the delta amount (increase is the default direction).
    fireEvent.change(deltaInputs[0], { target: { value: '5' } });

    expect(screen.getByTestId('adjust-stock-new-on-hand')).toHaveValue('23');

    fireEvent.click(screen.getByText(messages.Commerce.Editor.Inventory.Adjust.submit));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/commerce/products/prod-1/stock', [
        { variantId: 'var-1', onHand: 23 },
      ]),
    );
  });

  it('the "decrease" toggle flips the sign of the same typed delta', () => {
    renderDialog(18);

    fireEvent.click(screen.getByText(messages.Commerce.Editor.Inventory.Adjust.directionDecrease));
    const deltaInputs = screen.getAllByPlaceholderText('۰');
    fireEvent.change(deltaInputs[0], { target: { value: '5' } });

    expect(screen.getByTestId('adjust-stock-new-on-hand')).toHaveValue('13');
  });

  it('seeds the low-stock threshold input from the current value, and omits it from the PATCH when left untouched', async () => {
    renderDialog(18, 7);

    const input = screen.getByLabelText(
      messages.Commerce.Editor.Inventory.Adjust.lowStockThreshold,
    ) as HTMLInputElement;
    expect(input.value).toBe('7');

    fireEvent.click(screen.getByText(messages.Commerce.Editor.Inventory.Adjust.submit));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/commerce/products/prod-1/stock', [
        { variantId: 'var-1', onHand: 18, lowStockThreshold: 7 },
      ]),
    );
  });

  it('includes lowStockThreshold in the PATCH body only when the user provides one', async () => {
    renderDialog(18);

    fireEvent.change(
      screen.getByLabelText(messages.Commerce.Editor.Inventory.Adjust.lowStockThreshold),
      {
        target: { value: '5' },
      },
    );
    fireEvent.click(screen.getByText(messages.Commerce.Editor.Inventory.Adjust.submit));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/commerce/products/prod-1/stock', [
        { variantId: 'var-1', onHand: 18, lowStockThreshold: 5 },
      ]),
    );
  });

  it('after a successful PATCH, revalidates every SWR key under this product (detail + ledger)', async () => {
    renderDialog(18);

    fireEvent.click(screen.getByText(messages.Commerce.Editor.Inventory.Adjust.submit));

    await waitFor(() => expect(patch).toHaveBeenCalled());
    await waitFor(() => expect(mutateMock).toHaveBeenCalledWith(expect.any(Function)));

    // The matcher function passed to `mutate` must match both the plain product-detail key
    // and a paginated ledger key for this same product — never the unrelated product LIST key.
    const matcher = mutateMock.mock.calls[0][0] as (key: unknown) => boolean;
    expect(matcher('/commerce/products/prod-1')).toBe(true);
    expect(matcher('/commerce/products/prod-1/movements/var-1?page=1&limit=20')).toBe(true);
    expect(matcher('/commerce/products?page=1&limit=21')).toBe(false);

    expect(toastSuccess).toHaveBeenCalled();
  });

  it('a PATCH failure reports an error and never a success toast', async () => {
    patch.mockRejectedValueOnce(new Error('network'));
    renderDialog(18);

    fireEvent.click(screen.getByText(messages.Commerce.Editor.Inventory.Adjust.submit));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('a PATCH success followed by a revalidate-fetch rejection still reports success, never error, and re-enables the submit button', async () => {
    mutateMock.mockRejectedValueOnce(new Error('revalidate failed'));
    renderDialog(18);

    const submitButton = screen
      .getByText(messages.Commerce.Editor.Inventory.Adjust.submit)
      .closest('button')!;
    fireEvent.click(submitButton);

    await waitFor(() => expect(patch).toHaveBeenCalled());
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(toastError).not.toHaveBeenCalled();
    await waitFor(() => expect(submitButton).not.toBeDisabled());
  });

  it('disables submit and shows a validation message when the new stock is negative', () => {
    renderDialog(18);

    fireEvent.change(screen.getByTestId('adjust-stock-new-on-hand'), { target: { value: '-5' } });

    expect(
      screen.getByText(messages.Commerce.Editor.Inventory.Adjust.invalidStock),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.Commerce.Editor.Inventory.Adjust.submit).closest('button'),
    ).toBeDisabled();
    expect(patch).not.toHaveBeenCalled();
  });

  it('disables submit and never PATCHes when the viewer lacks product:edit', () => {
    mockCan.mockReturnValue(false);
    renderDialog(18);

    const submitButton = screen
      .getByText(messages.Commerce.Editor.Inventory.Adjust.submit)
      .closest('button')!;
    expect(submitButton).toBeDisabled();

    fireEvent.click(submitButton);
    expect(patch).not.toHaveBeenCalled();
  });
});

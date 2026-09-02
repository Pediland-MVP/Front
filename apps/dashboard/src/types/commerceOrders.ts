/**
 * Mirrors the shapes returned by Back's `apps/core/src/commerce/orders/orderView.mapper.ts`.
 *
 * Statuses and cancel reasons are string-literal unions rather than TS enums on purpose: they
 * arrive from JSON as plain strings, and a literal union compares correctly without importing a
 * runtime value that could be undefined.
 */

export type CommerceOrderStatus =
  | 'awaiting_review'
  | 'processing'
  | 'sending'
  | 'completed'
  | 'cancelled';

/**
 * `superseded` and `legacy_cancelled` are written only by the `CommerceOrderCoreData` backfill,
 * but they MUST render: after cutover this screen shows migrated legacy orders too.
 */
export type CommerceOrderCancelReason =
  | 'payment_rejected'
  | 'delivery_refused'
  | 'superseded'
  | 'legacy_cancelled';

export type CommerceProductKind = 'physical' | 'digital';

export interface ViewLine {
  variantId: string;
  productId: string;
  title: string;
  options: Array<{ name: string; value: string }>;
  imageUrl: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
}

export interface OrderView {
  orderId: string;
  status: CommerceOrderStatus;
  cancelReason: CommerceOrderCancelReason | null;
  kind: CommerceProductKind;
  lines: ViewLine[];
  itemsTotal: number;
  shippingTotal: number;
  grandTotal: number;
  paymentMethod: string;
  recipientName: string | null;
  mobile: string | null;
  cityId: number | null;
  address: string | null;
  plate: string | null;
  unit: string | null;
  postalcode: string | null;
  placedAt: string;
  shippingTitle: string | null;
  shippingKind: string | null;
  shippingSettlement: string | null;
  paidAt: string | null;
  createDate: string;
}

export interface OrderReceiptView {
  id: string;
  url: string;
  createDate: string;
}

/** Only `GET /commerce/orders/:id` returns receipts. The list never does. */
export interface OrderDetailView extends OrderView {
  receipts: OrderReceiptView[];
}

export interface OrdersFilters {
  page: number;
  limit: number;
  status?: CommerceOrderStatus;
  search?: string;
  from?: string;
  to?: string;
}

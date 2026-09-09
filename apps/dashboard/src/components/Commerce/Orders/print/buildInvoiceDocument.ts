import type { OrderDetailView } from '@/types/commerceOrders';
import { numberToPersianWords } from '@/utils/numberToPersianWords';
import { toPersianDigits } from '@/utils/toPersianDigits';
import { documentShell, esc } from './documentStyles';
import { orderReference, type PrintLabels } from './buildLabelDocument';

const money = (n: number) => toPersianDigits(n.toLocaleString('en-US'));

const INVOICE_CSS = `
  body { font-size: 3.2mm; line-height: 1.8; }
  .inv { display: flex; flex-direction: column; gap: 4mm; }
  .inv-head { display: flex; align-items: center; justify-content: space-between; }
  .inv-head h3 { margin: 0; font-size: 5mm; font-weight: 700; }
  .co { display: flex; align-items: center; gap: 2.5mm; }
  .co img { width: 11mm; height: 11mm; border-radius: 50%; object-fit: cover; }
  .co-txt { display: flex; flex-direction: column; line-height: 1.4; text-align: left; }
  .co-txt b { font-size: 3.6mm; }
  .co-txt span { font-size: 2.8mm; color: #5c5c5c; direction: ltr; }
  .tabbed { display: grid; grid-template-columns: 14mm 1fr;
            border: 0.35mm solid #c9c9c9; border-radius: 2mm; overflow: hidden; }
  .tabbed .tab { background: #f2f2f4; display: flex; align-items: center;
                 justify-content: center; font-weight: 700; font-size: 3.4mm;
                 border-left: 0.35mm solid #c9c9c9; }
  .tabbed .body { padding: 3mm 4mm; }
  .grid3 { display: grid; grid-template-columns: 1.9fr 1fr 1fr; gap: 0 4mm; }
  .row-full { grid-column: 1 / -1; }
  table.items { width: 100%; border-collapse: collapse; }
  table.items th, table.items td { border: 0.3mm solid #c9c9c9; padding: 2.4mm 2mm;
                                   text-align: center; }
  table.items thead th { background: #f2f2f4; font-weight: 700; font-size: 3mm; }
  table.items td.name { text-align: right; }
  table.items td.name .variant { display: block; font-size: 2.7mm; color: #5c5c5c; }
  .totals-band { display: grid; grid-template-columns: 1fr 78mm; gap: 4mm; align-items: start; }
  table.totals { width: 100%; border-collapse: collapse; }
  table.totals td { border: 0.3mm solid #c9c9c9; padding: 2.3mm 3mm; }
  table.totals td.lab { text-align: center; color: #5c5c5c; }
  table.totals td.val { text-align: center; width: 34mm; font-variant-numeric: tabular-nums; }
  table.totals tr.grand td { background: #f2f2f4; font-weight: 700; color: #171717; }
  .inv-foot { border: 0.35mm solid #c9c9c9; border-radius: 2mm;
              display: grid; grid-template-columns: repeat(5, 1fr); font-size: 3mm; }
  .inv-foot > div { padding: 2.6mm 3mm; border-left: 0.3mm solid #c9c9c9; text-align: center; }
  .inv-foot > div:last-child { border-left: 0; }
  .inv-foot b { display: block; color: #5c5c5c; font-weight: 500; font-size: 2.8mm; }
  .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-top: 2mm; }
  .signs > div { border-top: 0.3mm dashed #c9c9c9; padding-top: 2mm; color: #5c5c5c; }
`;

/**
 * The three values `Commerce.Orders`'s own `orderRowFields.ts` already treats as "known" --
 * kept as a local literal list (not imported) so this pure builder stays free of the app's
 * hook/component layer. `paymentMethodLabel` below falls back to the raw value for anything
 * else, matching that same guarded-lookup discipline.
 */
const KNOWN_PAYMENT_METHODS = ['card_to_card', 'free', 'cash_on_delivery'] as const;

/**
 * `Commerce.Orders.paymentMethod.*` already exists in `fa.json` for the orders list/table.
 * The caller is expected to pass those SAME translated labels through under the flat keys
 * `paymentMethod_card_to_card` / `paymentMethod_free` / `paymentMethod_cash_on_delivery` --
 * reusing the existing copy rather than inventing new wording. A value outside the known
 * three (e.g. a legacy-backfilled row) prints raw, same as `OrdersTable`/`OrderRowCard` do.
 */
function paymentMethodLabel(order: OrderDetailView, t: PrintLabels): string {
  const isKnown = (KNOWN_PAYMENT_METHODS as readonly string[]).includes(order.paymentMethod);
  return isKnown ? t[`paymentMethod_${order.paymentMethod}`] : order.paymentMethod;
}

/**
 * Order + shop -> a complete standalone A4 HTML document.
 *
 * `when` is the already-formatted «زمان ثبت» timestamp (e.g. via `toJalaliDateTime`), passed
 * in by the caller so this stays a pure function with no date/locale logic of its own -- it is
 * still routed through `toPersianDigits` here, not `esc` alone, so it never regresses to Latin
 * digits (the bug the original implementation's final review caught).
 *
 * Buyer city/province are resolved by the caller for the same reason `buildLabelDocument`
 * takes them as parameters: this keeps testable without `useShippingDestinations()`.
 */
export function buildInvoiceDocument(
  order: OrderDetailView,
  t: PrintLabels,
  when: string,
  buyerCityName: string | null,
  buyerProvinceName: string | null,
): string {
  const shop = order.shop;

  // Backend already applied the instagram.name / @instagram.username fallback.
  const sellerName = shop?.instagramName ?? '';
  const sellerHandle = shop?.instagramUsername ?? '';
  const buyerName = order.recipientName ?? '';
  const digits = (v: unknown) => (v ? toPersianDigits(esc(v)) : '');

  const logo = shop?.profilePictureUrl ? `<img src="${esc(shop.profilePictureUrl)}" alt="">` : '';

  const joinAddress = (
    province: string | null | undefined,
    city: string | null | undefined,
    address: string | null | undefined,
  ) => [province, city, address].filter(Boolean).map(esc).join('، ');

  const rows = order.lines
    .map((line, i) => {
      const options = (line.options ?? []).map((o) => `${o.name}: ${o.value}`).join('، ');

      // compareAtPrice is the pre-discount per-unit reference price. It only counts as a
      // discount when it is present AND higher than what was actually charged.
      const hasDiscount = line.compareAtPrice != null && line.compareAtPrice > line.unitPrice;
      const listUnitPrice = hasDiscount ? (line.compareAtPrice as number) : line.unitPrice;
      const lineTotalBeforeDiscount = listUnitPrice * line.quantity;
      const totalDiscount = hasDiscount ? lineTotalBeforeDiscount - line.lineTotal : 0;

      return `
      <tr>
        <td class="num">${toPersianDigits(i + 1)}</td>
        <td class="name">${esc(line.title)}${
          options ? `<span class="variant">${esc(options)}</span>` : ''
        }</td>
        <td class="num">${toPersianDigits(line.quantity)}</td>
        <td class="num">${money(line.unitPrice)}</td>
        <td class="num">${money(lineTotalBeforeDiscount)}</td>
        <td class="num">${money(totalDiscount)}</td>
        <td class="num">${money(line.lineTotal)}</td>
      </tr>`;
    })
    .join('');

  const trackingCode = order.followUpCode && order.followUpCode.trim() ? order.followUpCode : null;

  // Print the ACTUAL shipping method this order was placed with, falling back to the
  // shop's configured default only when the order itself carries none.
  const shippingMethod = order.shippingTitle ?? shop?.shippingMethod ?? null;
  const paymentLabel = paymentMethodLabel(order, t);

  const body = `
<div class="inv">
  <div class="inv-head">
    <h3>${esc(t['invoiceTitle'])}</h3>
    <div class="co">
      <div class="co-txt"><b>${esc(sellerName)}</b><span>@${esc(sellerHandle)}</span></div>
      ${logo}
    </div>
  </div>

  <div class="tabbed">
    <div class="tab">${esc(t['seller'])}</div>
    <div class="body"><div class="grid3">
      <div><span class="k">${esc(t['seller'])}:</span> ${esc(sellerName)}</div>
      <div><span class="k">${esc(t['phone'])}:</span> <span class="num">${digits(shop?.phone)}</span></div>
      <div><span class="k">${esc(t['postalCode'])}:</span> <span class="num">${digits(shop?.postalcode)}</span></div>
      <div class="row-full"><span class="k">${esc(t['address'])}:</span> ${joinAddress(
        shop?.provinceName,
        shop?.cityName,
        shop?.address,
      )}</div>
    </div></div>
  </div>

  <div class="tabbed">
    <div class="tab">${esc(t['buyer'])}</div>
    <div class="body"><div class="grid3">
      <div><span class="k">${esc(t['buyer'])}:</span> ${esc(buyerName)}</div>
      <div><span class="k">${esc(t['mobile'])}:</span> <span class="num">${digits(order.mobile)}</span></div>
      <div><span class="k">${esc(t['postalCode'])}:</span> <span class="num">${digits(order.postalcode)}</span></div>
      <div class="row-full"><span class="k">${esc(t['address'])}:</span> ${joinAddress(
        buyerProvinceName,
        buyerCityName,
        order.address,
      )}</div>
    </div></div>
  </div>

  <table class="items">
    <thead><tr>
      <th style="width:9mm">${esc(t['row'])}</th>
      <th>${esc(t['productName'])}</th>
      <th style="width:17mm">${esc(t['quantity'])}</th>
      <th style="width:26mm">${esc(t['unitPrice'])}<br>(${esc(t['toman'])})</th>
      <th style="width:26mm">${esc(t['lineTotal'])}<br>(${esc(t['toman'])})</th>
      <th style="width:24mm">${esc(t['discount'])}<br>(${esc(t['toman'])})</th>
      <th style="width:30mm">${esc(t['afterDiscount'])}<br>(${esc(t['toman'])})</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals-band">
    <div><span class="k">${esc(t['inWords'])}:</span> ${esc(
      `${numberToPersianWords(order.grandTotal)} ${t['toman']}`,
    )}</div>
    <table class="totals">
      <tr><td class="lab">${esc(t['subtotal'])}</td><td class="val">${money(order.itemsTotal)}</td></tr>
      <tr><td class="lab">${esc(t['shipping'])}</td><td class="val">+ ${money(order.shippingTotal)}</td></tr>
      <tr class="grand"><td class="lab">${esc(t['payable'])}</td><td class="val">${money(
        order.grandTotal,
      )}</td></tr>
    </table>
  </div>

  <div class="inv-foot">
    <div><b>${esc(t['trackingCode'])}</b><span class="num">${trackingCode ? digits(trackingCode) : '—'}</span></div>
    <div><b>${esc(t['orderRef'])}</b><span class="num">${esc(orderReference(order.orderId))}</span></div>
    <div><b>${esc(t['paymentMethod'])}</b>${esc(paymentLabel)}</div>
    <div><b>${esc(t['registeredAt'])}</b><span class="num">${digits(when)}</span></div>
    <div><b>${esc(t['shippingMethod'])}</b>${esc(shippingMethod ?? t['defaultShippingMethod'])}</div>
  </div>

  <div class="signs">
    <div>${esc(t['sellerSignature'])}:</div>
    <div>${esc(t['buyerSignature'])}:</div>
  </div>
</div>`;

  return documentShell(body, 'A4', INVOICE_CSS);
}

import type { OrderNamespace } from '@/types/order/order.namespace';
import { numberToPersianWords } from '@/utils/numberToPersianWords';
import { toPersianDigits } from '@/utils/toPersianDigits';
import { documentShell, esc } from './documentStyles';
import { orderReference, type PrintLabels } from './buildLabelDocument';
import { calculateOrderTotals } from './orderTotals';

type Order = OrderNamespace.GET.OneItemOfOrders;

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
 * The newest transaction that both succeeded and carries a refId. Card-to-card orders
 * never match — that is the expected path, not an error, and the caller prints an em dash.
 */
function trackingCode(order: Order): string | null {
  const candidates = (order.transactions ?? [])
    .filter((tx) => tx.status === 'success' && !!tx.refId)
    .sort((a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime());

  return candidates[0]?.refId ?? null;
}

export function buildInvoiceDocument(order: Order, t: PrintLabels, when: string): string {
  const ig = order.instagram;
  const shop = ig?.shopAddress ?? null;
  const ship = order.orderShipping ?? null;
  const totals = calculateOrderTotals(order.orderProducts);

  const sellerName = ig?.name?.trim() || (ig?.username ? `@${ig.username}` : '');
  const buyerName = [ship?.firstname, ship?.lastname].filter(Boolean).join(' ');
  const digits = (v: unknown) => (v ? toPersianDigits(esc(v)) : '');

  const logo = ig?.profilePictureUrl ? `<img src="${esc(ig.profilePictureUrl)}" alt="">` : '';

  const joinAddress = (
    province: string | undefined,
    city: string | undefined,
    address: string | undefined,
  ) => [province, city, address].filter(Boolean).map(esc).join('، ');

  const rows = order.orderProducts
    .map((op, i) => {
      const line = totals.lines[i];
      const variants = (op.attributeValues ?? []).map((av) => esc(av.value)).join(' · ');
      return `
      <tr>
        <td class="num">${toPersianDigits(i + 1)}</td>
        <td class="name">${esc(op.product?.title ?? '')}${
          variants ? `<span class="variant">${variants}</span>` : ''
        }</td>
        <td class="num">${toPersianDigits(line.quantity)}</td>
        <td class="num">${money(line.unitPrice)}</td>
        <td class="num">${money(line.lineTotal)}</td>
        <td class="num">${money(line.discount)}</td>
        <td class="num">${money(line.lineAfterDiscount)}</td>
      </tr>`;
    })
    .join('');

  const refId = trackingCode(order);
  const paymentLabel = order.paymentMethod === 'card_to_card' ? t['cardToCard'] : t['zarinpal'];

  const body = `
<div class="inv">
  <div class="inv-head">
    <h3>${esc(t['invoiceTitle'])}</h3>
    <div class="co">
      <div class="co-txt"><b>${esc(sellerName)}</b><span>@${esc(ig?.username ?? '')}</span></div>
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
        shop?.city?.province?.name,
        shop?.city?.name,
        shop?.address ?? undefined,
      )}</div>
    </div></div>
  </div>

  <div class="tabbed">
    <div class="tab">${esc(t['buyer'])}</div>
    <div class="body"><div class="grid3">
      <div><span class="k">${esc(t['buyer'])}:</span> ${esc(buyerName)}</div>
      <div><span class="k">${esc(t['mobile'])}:</span> <span class="num">${digits(ship?.mobile)}</span></div>
      <div><span class="k">${esc(t['postalCode'])}:</span> <span class="num">${digits(ship?.postalcode)}</span></div>
      <div class="row-full"><span class="k">${esc(t['address'])}:</span> ${joinAddress(
        ship?.city?.province?.name,
        ship?.city?.name,
        ship?.address ?? undefined,
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
      `${numberToPersianWords(totals.payable)} ${t['toman']}`,
    )}</div>
    <table class="totals">
      <tr><td class="lab">${esc(t['subtotal'])}</td><td class="val">${money(totals.subtotal)}</td></tr>
      <tr><td class="lab">${esc(t['shipping'])}</td><td class="val">+ ${money(totals.shipping)}</td></tr>
      <tr class="grand"><td class="lab">${esc(t['payable'])}</td><td class="val">${money(
        totals.payable,
      )}</td></tr>
    </table>
  </div>

  <div class="inv-foot">
    <div><b>${esc(t['trackingCode'])}</b><span class="num">${refId ? digits(refId) : '—'}</span></div>
    <div><b>${esc(t['orderRef'])}</b><span class="num">${esc(orderReference(order.id))}</span></div>
    <div><b>${esc(t['paymentMethod'])}</b>${esc(paymentLabel)}</div>
    <div><b>${esc(t['registeredAt'])}</b><span class="num">${digits(when)}</span></div>
    <div><b>${esc(t['shippingMethod'])}</b>${esc(shop?.shippingMethod ?? t['defaultShippingMethod'])}</div>
  </div>

  <div class="signs">
    <div>${esc(t['sellerSignature'])}:</div>
    <div>${esc(t['buyerSignature'])}:</div>
  </div>
</div>`;

  return documentShell(body, 'A4', INVOICE_CSS);
}

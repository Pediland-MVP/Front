import type { OrderNamespace } from '@/types/order/order.namespace';
import { toPersianDigits } from '@/utils/toPersianDigits';
import { documentShell, esc } from './documentStyles';

type Order = OrderNamespace.GET.OneItemOfOrders;

export interface PrintLabels {
  [key: string]: string;
}

/** A short, human-quotable reference. The raw UUID is unusable on a parcel. */
export function orderReference(orderId: string): string {
  return `BF-${orderId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

const LABEL_CSS = `
  body { font-size: 3.4mm; line-height: 1.85; padding: 10mm; }
  .lbl { display: flex; flex-direction: column; gap: 4mm; height: 190mm; }
  .lbl-top { display: grid; grid-template-columns: 1fr 32mm; gap: 3mm; }
  .lbl-mid { display: grid; grid-template-columns: 1fr 36mm; gap: 3mm; }
  .brand { display: flex; flex-direction: column; align-items: center;
           justify-content: center; gap: 1.6mm; text-align: center; }
  .brand img { width: 17mm; height: 17mm; border-radius: 50%; object-fit: cover;
               border: 0.35mm solid #c9c9c9; }
  .brand .fallback { width: 17mm; height: 17mm; border-radius: 50%; background: #f2f2f4;
                     border: 0.35mm solid #c9c9c9; display: flex; align-items: center;
                     justify-content: center; font-size: 6mm; font-weight: 800; }
  .brand .handle { font-size: 2.7mm; color: #5c5c5c; direction: ltr; }
  .party-name { font-size: 4.4mm; font-weight: 700; margin-bottom: 2.5mm; }
  .party-name span { font-weight: 500; }
  .lbl-mid .party-name { font-size: 5mm; }
  .lbl-mid .addr { font-size: 3.7mm; font-weight: 500; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 5mm; }
  .row-full { grid-column: 1 / -1; }
  .sticker { display: flex; align-items: center; justify-content: center;
             text-align: center; color: #5c5c5c; font-size: 3.2mm; border-style: dashed; }
  .lbl-foot { margin-top: auto; display: flex; gap: 3mm; }
  .lbl-foot .box { flex: 1; padding: 2.6mm 4mm; display: flex; align-items: center; }
  .lbl-foot .box.tight { flex: 0 0 auto; }
`;

export function buildLabelDocument(order: Order, t: PrintLabels): string {
  const ig = order.instagram;
  const shop = ig?.shopAddress ?? null;
  const ship = order.orderShipping ?? null;

  // The name is what a courier reads; the handle is the fallback and always shown
  // beneath it, so a nameless page is still identifiable.
  const senderName = ig?.name?.trim() || (ig?.username ? `@${ig.username}` : '');

  const logo = ig?.profilePictureUrl
    ? `<img src="${esc(ig.profilePictureUrl)}" alt="">`
    : `<div class="fallback">${esc(senderName.replace('@', '').charAt(0))}</div>`;

  const receiverName = [ship?.firstname, ship?.lastname].filter(Boolean).join(' ');
  const digits = (v: unknown) => (v ? toPersianDigits(esc(v)) : '');

  const body = `
<div class="lbl">
  <div class="lbl-top">
    <div class="box">
      <div class="party-name">${esc(t['sender'])}: <span>${esc(senderName)}</span></div>
      <div class="grid2">
        <div><span class="k">${esc(t['state'])}:</span> ${esc(shop?.city?.province?.name ?? '')}</div>
        <div><span class="k">${esc(t['city'])}:</span> ${esc(shop?.city?.name ?? '')}</div>
        <div class="row-full"><span class="k">${esc(t['address'])}:</span> ${esc(shop?.address ?? '')}</div>
        <div><span class="k">${esc(t['phone'])}:</span> <span class="num">${digits(shop?.phone)}</span></div>
        <div><span class="k">${esc(t['postalCode'])}:</span> <span class="num">${digits(shop?.postalcode)}</span></div>
      </div>
    </div>
    <div class="box brand">${logo}<div class="handle">@${esc(ig?.username ?? '')}</div></div>
  </div>

  <div class="lbl-mid">
    <div class="box">
      <div class="party-name">${esc(t['receiver'])}: <span>${esc(receiverName)}</span></div>
      <div class="grid2">
        <div><span class="k">${esc(t['state'])}:</span> ${esc(ship?.city?.province?.name ?? '')}</div>
        <div><span class="k">${esc(t['city'])}:</span> ${esc(ship?.city?.name ?? '')}</div>
        <div class="row-full addr"><span class="k">${esc(t['address'])}:</span> ${esc(ship?.address ?? '')}</div>
        <div><span class="k">${esc(t['phone'])}:</span> <span class="num">${digits(ship?.mobile)}</span></div>
        <div><span class="k">${esc(t['postalCode'])}:</span> <span class="num">${digits(ship?.postalcode)}</span></div>
      </div>
    </div>
    <div class="box sticker">${esc(t['stickerArea'])}</div>
  </div>

  <div class="lbl-foot">
    <div class="box"><span class="k">${esc(t['shippingMethod'])}:&nbsp;</span> ${esc(shop?.shippingMethod ?? '')}</div>
    <div class="box tight"><span class="k">${esc(t['orderRef'])}:&nbsp;</span> <span class="num">${esc(orderReference(order.id))}</span></div>
  </div>
</div>`;

  return documentShell(body, 'A5', LABEL_CSS);
}

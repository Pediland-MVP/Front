import type { OrderDetailView } from '@/types/commerceOrders';
import { toPersianDigits } from '@/utils/toPersianDigits';
import { documentShell, esc } from './documentStyles';

/**
 * Flat map of every printed word — bracket-notation access throughout
 * (`noPropertyAccessFromIndexSignature: true` is on for this app), never `t.foo`.
 */
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

/**
 * Order + shop -> a complete standalone A5 HTML document.
 *
 * Pure and testable on purpose: buyer city/province are resolved by the CALLER (Task 8, via
 * `useShippingDestinations().cityById`/`provinceById`) and passed in, so this stays a plain
 * function with no data-fetching context. The sender's own city/province and instagram
 * name/username fallback already live on `order.shop` (backend-resolved) — render them as-is.
 */
export function buildLabelDocument(
  order: OrderDetailView,
  t: PrintLabels,
  buyerCityName: string | null,
  buyerProvinceName: string | null,
): string {
  const shop = order.shop;

  // Backend already applied the instagram.name / @instagram.username fallback — do not
  // reimplement it here.
  const senderName = shop?.instagramName ?? '';
  const senderHandle = shop?.instagramUsername ?? '';
  const fallbackLetter = (senderName || senderHandle).charAt(0);

  // The fallback <div> is always in the DOM alongside the <img>, hidden by inline style, so a
  // profile picture URL that fails to load AFTER the initial render (e.g. an expired Meta CDN
  // URL) can swap to it via onerror -- never leaving a broken-image icon on the printed parcel.
  const logo = shop?.profilePictureUrl
    ? `<img src="${esc(shop.profilePictureUrl)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="fallback" style="display:none">${esc(fallbackLetter)}</div>`
    : `<div class="fallback">${esc(fallbackLetter)}</div>`;

  const receiverName = order.recipientName ?? '';
  // Convert digits FIRST, then escape -- escaping first turns a literal `'` into the entity
  // `&#39;` (ASCII digits 3 and 9), which a subsequent digit-conversion pass would mangle into
  // the non-parsing `&#۳۹;`. `esc(toPersianDigits(...))` never re-touches its own escaped output.
  const digits = (v: unknown) => (v ? esc(toPersianDigits(String(v))) : '');

  // The ACTUAL shipping method this order was placed with -- there is no shop-level default to
  // fall back to: `order.shippingTitle` is a snapshot of the buyer's chosen `CommerceShippingOption`
  // and can never disagree with what the order itself charged for, unlike a separately-configured
  // shop setting.
  const shippingMethod = order.shippingTitle ?? null;

  const body = `
<div class="lbl">
  <div class="lbl-top">
    <div class="box">
      <div class="party-name">${esc(t['sender'])}: <span>${esc(senderName)}</span></div>
      <div class="grid2">
        <div><span class="k">${esc(t['state'])}:</span> ${esc(shop?.provinceName ?? '')}</div>
        <div><span class="k">${esc(t['city'])}:</span> ${esc(shop?.cityName ?? '')}</div>
        <div class="row-full"><span class="k">${esc(t['address'])}:</span> ${esc(shop?.address ?? '')}</div>
        <div><span class="k">${esc(t['phone'])}:</span> <span class="num">${digits(shop?.phone)}</span></div>
        <div><span class="k">${esc(t['postalCode'])}:</span> <span class="num">${digits(shop?.postalcode)}</span></div>
      </div>
    </div>
    <div class="box brand">${logo}<div class="handle">@${esc(senderHandle)}</div></div>
  </div>

  <div class="lbl-mid">
    <div class="box">
      <div class="party-name">${esc(t['receiver'])}: <span>${esc(receiverName)}</span></div>
      <div class="grid2">
        <div><span class="k">${esc(t['state'])}:</span> ${esc(buyerProvinceName ?? '')}</div>
        <div><span class="k">${esc(t['city'])}:</span> ${esc(buyerCityName ?? '')}</div>
        <div class="row-full addr"><span class="k">${esc(t['address'])}:</span> ${esc(order.address ?? '')}</div>
        <div><span class="k">${esc(t['phone'])}:</span> <span class="num">${digits(order.mobile)}</span></div>
        <div><span class="k">${esc(t['postalCode'])}:</span> <span class="num">${digits(order.postalcode)}</span></div>
      </div>
    </div>
    <div class="box sticker">${esc(t['stickerArea'])}</div>
  </div>

  <div class="lbl-foot">
    <div class="box"><span class="k">${esc(t['shippingMethod'])}:&nbsp;</span> ${esc(shippingMethod ?? t['defaultShippingMethod'])}</div>
    <div class="box tight"><span class="k">${esc(t['orderRef'])}:&nbsp;</span> <span class="num">${esc(orderReference(order.orderId))}</span></div>
  </div>
</div>`;

  return documentShell(body, 'A5', LABEL_CSS);
}

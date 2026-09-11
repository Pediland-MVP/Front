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

/**
 * The label sizes itself to the sheet it is printed on.
 *
 * In print the media viewport IS the page box, so `vmin` is the short edge of the actual paper
 * the user chose in the dialog. Two units are derived from it (`--su` for space, `--tu` for
 * type) and every dimension is a multiple of one of them, which makes the whole label one
 * design resized -- continuously -- rather than a set of stepped presets. That is the whole
 * reason `@page { size: auto }` is worth having: pinning `A5 portrait` would freeze `vmin` at
 * one value and freeze the label with it.
 *
 * Both units equal 1mm at A5 portrait, so every multiplier below is literally the millimetre
 * number this label used to hard-code, and A5 keeps the layout it always had (to within the
 * -0.07% the browser introduces by rounding the page box to whole CSS pixels).
 */
const LABEL_CSS = `
  /*
   * SCALE IS CONTINUOUS, STRUCTURE IS BY BREAKPOINT.
   *
   * In print the viewport IS the page box, so \`vmin\` is the short edge of the actual sheet.
   * Two units are derived from it and EVERY dimension below is a multiple of one of them, so
   * the label is one design photographically resized to the paper -- not a handful of stepped
   * presets. Buckets were the first attempt and they visibly failed upward: A3/A2/A1/A0 all
   * matched the same ">=180mm" rule and printed A4-sized type on a sheet up to four times
   * wider, which reads as a small label marooned in the middle of a big sheet.
   *
   * Both units are 1mm at A5 portrait (148mm short edge), so every multiplier below is literally
   * the millimetre value this label used to hard-code and A5 keeps the layout it always had. The
   * one deviation is -0.07%: the browser rounds the page box to whole CSS pixels (148mm -> 559px,
   * not 559.37px), which is 0.007mm on a 10mm margin. Measured, not assumed.
   */
  :root {
    /* Space, boxes and the logo: pure proportion, no floor and no ceiling. Margins should
       always be the same FRACTION of the sheet, which is what keeps a 57mm margin on A0 and a
       6.8mm one on a thermal label both look like the same design. 148 is A5 portrait's short
       edge, so this is EXACTLY 1mm there -- not a rounded decimal that would drift. */
    --su: calc(100vmin / 148);
    /* Type: same proportion, but never below a legible floor. A courier reads a 100x150 thermal
       label from the same distance as an A4 one, so text is the one thing that must NOT shrink
       linearly all the way down. The floor only ever engages below ~A6; from A5 up the two
       units are identical and the whole label scales together.
       The floor doubles as the failure mode: if a browser ever resolved \`vmin\` against the
       hidden 0x0 print iframe instead of the page box, \`max()\` still yields 0.82mm and the
       label prints small-but-correct rather than collapsing to zero-height text. */
    --tu: max(0.82mm, 100vmin / 148);

    --pad: calc(10 * var(--su));      /* page edge -> content */
    --gap: calc(4 * var(--su));       /* between the three bands */
    --gap-in: calc(3 * var(--su));    /* inside a band */
    --bpad: calc(4 * var(--su));      /* inside a box */
    --radius: calc(2 * var(--su));
    --bw: calc(0.35 * var(--su));
    --name-mb: calc(2.5 * var(--su));
    --foot-pad-y: calc(2.6 * var(--su));
    --col-gap: calc(5 * var(--su));
    --logo: calc(17 * var(--su));
    --brand-col: calc(32 * var(--su));
    --sticker-col: calc(36 * var(--su));

    --lh: 1.85;
    --fs: calc(3.4 * var(--tu));
    --fs-name: calc(4.4 * var(--tu));
    --fs-name-mid: calc(5 * var(--tu));   /* the receiver reads bigger than the sender on purpose */
    --fs-addr: calc(3.7 * var(--tu));
    --fs-handle: calc(2.7 * var(--tu));
    --fs-sticker: calc(3.2 * var(--tu));
  }

  html, body { height: 100%; }
  body { font-size: var(--fs); line-height: var(--lh); padding: var(--pad); }
  .box { border-width: var(--bw); border-radius: var(--radius); padding: var(--bpad); }

  .lbl { display: flex; flex-direction: column; gap: var(--gap); height: 100%; }
  /* The receiver band takes every millimetre the paper has spare, so a taller page grows the
     courier's sticker area rather than opening a dead gap above the footer (which is what
     \`margin-top: auto\` on the footer used to do at exactly one paper size). */
  .lbl-top { flex: 0 0 auto; display: grid; grid-template-columns: 1fr var(--brand-col); gap: var(--gap-in); }
  .lbl-mid { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: 1fr var(--sticker-col); gap: var(--gap-in); }
  .lbl-foot { flex: 0 0 auto; display: flex; gap: var(--gap-in); }

  .brand { display: flex; flex-direction: column; align-items: center;
           justify-content: center; gap: calc(1.6 * var(--su)); text-align: center; }
  .brand img { width: var(--logo); height: var(--logo); border-radius: 50%; object-fit: cover;
               border: var(--bw) solid #c9c9c9; }
  .brand .fallback { width: var(--logo); height: var(--logo); border-radius: 50%; background: #f2f2f4;
                     border: var(--bw) solid #c9c9c9; display: flex; align-items: center;
                     justify-content: center; font-size: calc(var(--logo) * 0.35); font-weight: 800; }
  .brand .handle { font-size: var(--fs-handle); color: #5c5c5c; direction: ltr; }
  .party-name { font-size: var(--fs-name); font-weight: 700; margin-bottom: var(--name-mb); }
  .party-name span { font-weight: 500; }
  .lbl-mid .party-name { font-size: var(--fs-name-mid); }
  .lbl-mid .addr { font-size: var(--fs-addr); font-weight: 500; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 var(--col-gap); }
  .row-full { grid-column: 1 / -1; }
  .sticker { display: flex; align-items: center; justify-content: center;
             text-align: center; color: #5c5c5c; font-size: var(--fs-sticker); border-style: dashed; }
  .lbl-foot .box { flex: 1; padding: var(--foot-pad-y) var(--bpad); display: flex; align-items: center; }
  .lbl-foot .box.tight { flex: 0 0 auto; }

  /* ------------------------------------------------------------------------------------- */
  /* Below here: STRUCTURE only. These are the decisions that genuinely are not continuous  */
  /* -- you cannot half-rotate a layout -- so they stay breakpoints while scale does not.   */
  /* ------------------------------------------------------------------------------------- */

  /* Landscape: sender and receiver side by side. Stacking three full-width bands down a
     100mm-tall sheet overflows onto a second one, and on A4 landscape it stretches a
     five-field address across 270mm. Splitting the width halves the height the label needs
     and keeps each block a readable column. */
  @media (orientation: landscape) {
    .lbl { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr auto; }
    .lbl-top { grid-column: 1; grid-row: 1; }
    .lbl-mid { grid-column: 2; grid-row: 1; }
    .lbl-foot { grid-column: 1 / -1; grid-row: 2; }
    /* Half the width is too little to also carry a side column, so the brand and the sticker
       area drop below their own party instead of beside it. */
    .lbl-top, .lbl-mid { grid-template-columns: 1fr; grid-template-rows: 1fr auto; }
    .lbl-mid { grid-template-rows: auto 1fr; }
    .brand { flex-direction: row; gap: calc(2.5 * var(--su)); }
    .sticker { min-height: calc(14 * var(--su)); }
  }

  /* Below A4 landscape the half-width column cannot hold two fields per row. This is a
     ratio question, not a size one -- it is about how many columns fit, so it stays a query. */
  @media (orientation: landscape) and (max-width: 240mm) {
    .grid2 { grid-template-columns: 1fr; }
  }

  /* Short sheets (thermal landscape, A6 landscape). These are exactly the sizes where the type
     floor above is holding text ABOVE its proportional size, so the leading has to come in to
     pay for it -- otherwise the floor is what pushes the footer onto a second sheet. */
  @media (max-height: 130mm) {
    :root { --lh: 1.5; }
  }
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

  return documentShell(body, 'auto', LABEL_CSS);
}

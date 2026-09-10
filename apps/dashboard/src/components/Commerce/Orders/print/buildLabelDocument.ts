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
 * Every dimension is a custom property so a paper bucket can re-tune the whole label by
 * overriding a dozen tokens, instead of restating the layout once per size. The base values are
 * the A5 portrait label this started as -- at 148x210 with `--pad: 10mm` the old hard-coded
 * `height: 190mm` and `height: 100%` are the same number, so A5 output is unchanged.
 *
 * The buckets below are plain media queries because in print the viewport IS the page box: a
 * `max-width: 120mm` query matches the paper the user picked in the dialog, not the screen.
 * That is the whole reason `@page { size: auto }` is worth it -- pinning `A5 portrait` would
 * force every query to one answer.
 */
const LABEL_CSS = `
  :root {
    --pad: 10mm;          /* page edge -> content */
    --gap: 4mm;           /* between the three bands */
    --gap-in: 3mm;        /* inside a band */
    --bpad: 4mm;          /* inside a box */
    --radius: 2mm;
    --bw: 0.35mm;
    --lh: 1.85;
    --fs: 3.4mm;
    --fs-name: 4.4mm;
    --fs-name-mid: 5mm;   /* the receiver reads bigger than the sender on purpose */
    --fs-addr: 3.7mm;
    --fs-handle: 2.7mm;
    --fs-sticker: 3.2mm;
    --name-mb: 2.5mm;
    --logo: 17mm;
    --brand-col: 32mm;
    --sticker-col: 36mm;
    --foot-pad-y: 2.6mm;
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
           justify-content: center; gap: 1.6mm; text-align: center; }
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
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 5mm; }
  .row-full { grid-column: 1 / -1; }
  .sticker { display: flex; align-items: center; justify-content: center;
             text-align: center; color: #5c5c5c; font-size: var(--fs-sticker); border-style: dashed; }
  .lbl-foot .box { flex: 1; padding: var(--foot-pad-y) var(--bpad); display: flex; align-items: center; }
  .lbl-foot .box.tight { flex: 0 0 auto; }

  /* --- Small paper: 100x150 thermal, A6 (105mm wide). ------------------------------------ */
  @media (max-width: 120mm) {
    :root {
      --pad: 4mm; --gap: 2.5mm; --gap-in: 2mm; --bpad: 2.6mm; --radius: 1.5mm;
      --lh: 1.6; --fs: 2.8mm; --fs-name: 3.5mm; --fs-name-mid: 3.9mm; --fs-addr: 3mm;
      --fs-handle: 2.3mm; --fs-sticker: 2.6mm; --name-mb: 1.6mm;
      --logo: 12mm; --brand-col: 20mm; --sticker-col: 24mm; --foot-pad-y: 1.8mm;
    }
    .grid2 { gap: 0 3mm; }
  }

  /* --- Large paper: A4 either way, Letter, anything else big in BOTH directions. --------- */
  /* The height half of this query is load-bearing. Width alone let A5 landscape (210x148) in,
     and 4.4mm type plus 14mm margins on a 148mm-tall sheet pushed the footer onto a second
     page -- caught by printing the fixture to PDF and counting pages, not by reading the CSS. */
  @media (min-width: 180mm) and (min-height: 180mm) {
    :root {
      --pad: 14mm; --gap: 6mm; --gap-in: 5mm; --bpad: 6mm; --radius: 2.5mm;
      --fs: 4.4mm; --fs-name: 5.8mm; --fs-name-mid: 6.6mm; --fs-addr: 4.8mm;
      --fs-handle: 3.4mm; --fs-sticker: 4.2mm; --name-mb: 3.5mm;
      --logo: 24mm; --brand-col: 46mm; --sticker-col: 54mm; --foot-pad-y: 4mm;
    }
    .grid2 { gap: 0 8mm; }
  }

  /* --- Landscape: sender and receiver side by side. -------------------------------------- */
  /* Stacking three full-width bands down a 100mm-tall page overflows onto a second sheet, and on
     A4 landscape it stretches a five-field address across 270mm. Splitting the width in two
     halves the height the label needs and keeps each block a readable column. */
  @media (orientation: landscape) {
    .lbl { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr auto; }
    .lbl-top { grid-column: 1; grid-row: 1; }
    .lbl-mid { grid-column: 2; grid-row: 1; }
    .lbl-foot { grid-column: 1 / -1; grid-row: 2; }
    /* Half the width is too little to also carry a side column, so the brand and the sticker
       area drop below their own party instead of beside it. */
    .lbl-top, .lbl-mid { grid-template-columns: 1fr; grid-template-rows: 1fr auto; }
    .lbl-mid { grid-template-rows: auto 1fr; }
    .brand { flex-direction: row; gap: 2.5mm; }
    .sticker { min-height: 14mm; }
  }

  /* Below A4 landscape the half-width column cannot hold two fields per row. */
  @media (orientation: landscape) and (max-width: 240mm) {
    .grid2 { grid-template-columns: 1fr; }
  }

  /* --- Short paper (100/105mm tall: thermal + A6, both landscape). ----------------------- */
  /* Last on purpose: these override whatever width bucket already matched, because on a short
     page height is the binding constraint, not width. */
  @media (max-height: 130mm) {
    :root {
      --pad: 4mm; --gap: 2.5mm; --gap-in: 2mm; --bpad: 2.6mm; --radius: 1.5mm;
      --lh: 1.5; --fs: 2.9mm; --fs-name: 3.6mm; --fs-name-mid: 4mm; --fs-addr: 3.1mm;
      --fs-handle: 2.3mm; --fs-sticker: 2.6mm; --name-mb: 1.6mm;
      --logo: 13mm; --brand-col: 22mm; --sticker-col: 26mm; --foot-pad-y: 1.8mm;
    }
    .grid2 { gap: 0 3mm; }
    .sticker { min-height: 9mm; }
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

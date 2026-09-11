/** Escape everything that reaches the document — every field below is user-controlled. */
export function esc(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const BASE_CSS = `
  @font-face {
    font-family: 'YekanBakh';
    src: url('/fonts/YekanBakhFaNum-VF.woff2') format('woff2');
    font-weight: 100 900;
    font-display: block;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'YekanBakh', Tahoma, sans-serif;
    direction: rtl;
    color: #171717;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .k { color: #5c5c5c; }
  .num { font-variant-numeric: tabular-nums; }
  .box { border: 0.35mm solid #c9c9c9; border-radius: 2mm; padding: 4mm; }
`;

/**
 * Wraps a document body in a complete standalone HTML page.
 *
 * Everything is sized in millimetres so the output does not depend on the screen's
 * pixel density — the same string prints identically from a 1x laptop and a 4K monitor.
 *
 * `page` is the paper the document is COMMITTED to. `'auto'` commits to nothing: the browser's
 * print dialog decides, and the document's own CSS is expected to lay itself out against
 * whatever comes back (see `buildLabelDocument`). A named size instead pins the paper, which is
 * what a fixed-format document like the invoice wants.
 */
export function documentShell(body: string, page: 'A5' | 'A4' | 'auto', extraCss: string): string {
  // A named page gets the shell's own margin; `auto` gets none, because a document that sizes
  // itself to the paper has to own its edge spacing too (a fixed mm margin would eat a third of
  // a 100x150 thermal label while barely showing on A4).
  const pageBox = page === 'auto' ? 'auto' : `${page} portrait`;
  const margin = page === 'A4' ? '10mm' : '0';
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<style>
@page { size: ${pageBox}; margin: ${margin}; }
${BASE_CSS}
${extraCss}
</style>
</head>
<body>${body}</body>
</html>`;
}

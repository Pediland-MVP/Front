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
 */
export function documentShell(body: string, page: 'A5' | 'A4', extraCss: string): string {
  const margin = page === 'A5' ? '0' : '10mm';
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<style>
@page { size: ${page} portrait; margin: ${margin}; }
${BASE_CSS}
${extraCss}
</style>
</head>
<body>${body}</body>
</html>`;
}

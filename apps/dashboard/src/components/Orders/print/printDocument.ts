/**
 * Prints a standalone HTML string through a hidden same-origin iframe.
 *
 * Not `@media print` on the page itself: the order details live inside a Radix dialog
 * rendered through a portal with its own scroll containers and transforms. Printing the
 * main document means fighting that portal's CSS, and it breaks differently in every
 * browser. An iframe is a fresh document holding only our own stylesheet.
 */
export function printDocument(html: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';

    let settled = false;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener('focus', onFocus);
      // Give the print dialog a beat to take its snapshot before the document goes away.
      setTimeout(() => iframe.remove(), 500);
      resolve();
    };

    // afterprint does not fire in every browser/dialog combination, so a window focus
    // event is the fallback that stops the iframe leaking into the DOM forever.
    const onFocus = () => setTimeout(cleanup, 300);

    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) {
        cleanup();
        return;
      }

      win.addEventListener('afterprint', cleanup);
      window.addEventListener('focus', onFocus);

      // Waiting on fonts.ready is what stops the first print coming out in Tahoma:
      // the layout is measured before the woff2 has decoded otherwise.
      const fonts = (win.document as Document & { fonts?: FontFaceSet }).fonts;
      const ready = fonts?.ready ?? Promise.resolve();

      ready.then(() => {
        win.focus();
        win.print();
      });
    };

    document.body.appendChild(iframe);

    // srcdoc keeps the iframe same-origin, so /fonts/… resolves and no blob URL is needed.
    iframe.srcdoc = html;
  });
}

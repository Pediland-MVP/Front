/**
 * The description field is a WYSIWYG surface: the merchant sees formatted text, never markup,
 * but **markdown is what gets stored** (`commerce_product.description` is plain text and the
 * storefront and DM card both render it). These functions are the bridge.
 *
 * Only the subset the toolbar can produce is supported — bold, italic, link, `###` heading and
 * `-` bullets. Anything else round-trips as a plain paragraph rather than being mangled.
 */

/**
 * Quotes are escaped as well as angle brackets, and that is load-bearing rather than tidy: the
 * link rule interpolates a captured url straight into `href="…"`, so an unescaped `"` in
 * `[x](https://a" onmouseover="alert(1))` would close the attribute and inject a handler.
 */
const escapeHtml = (value: string): string =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Only http(s) and mailto survive. Any other scheme is dropped and the label kept as text. */
const safeHref = (raw: string): string | null => {
  const value = raw.trim();
  // A quote (raw or already HTML-escaped) means the captured "url" ran past a real address into
  // injected attribute text — reject it rather than keep serving the attacker's trailing payload.
  if (/"|&quot;|'|&#39;/.test(value)) return null;
  if (/^(https?:|mailto:)/i.test(value)) return value;
  if (/^[^:/?#]+:/.test(value)) return null; // any other scheme, including javascript:
  return value; // relative or protocol-less — harmless
};

export const markdownToHtml = (source: string, emptyText: string): string => {
  const lines = escapeHtml(source || '').split('\n');
  let out = '';
  let inList = false;

  const inline = (text: string): string =>
    text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, href: string) => {
        const safe = safeHref(href);
        return safe
          ? `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>`
          : label;
      });

  for (const raw of lines) {
    const line = raw.trim();
    if (/^-\s+/.test(line)) {
      if (!inList) {
        out += '<ul>';
        inList = true;
      }
      out += `<li>${inline(line.replace(/^-\s+/, ''))}</li>`;
      continue;
    }
    if (inList) {
      out += '</ul>';
      inList = false;
    }
    if (/^#{1,6}\s+/.test(line)) out += `<h3>${inline(line.replace(/^#{1,6}\s+/, ''))}</h3>`;
    else if (line) out += `<p>${inline(line)}</p>`;
  }
  if (inList) out += '</ul>';

  return out || `<p data-empty="true">${escapeHtml(emptyText)}</p>`;
};

export const htmlToMarkdown = (root: HTMLElement): string => {
  const inline = (node: Node): string => {
    let out = '';
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        out += (child.nodeValue ?? '').replace(/\s*\n\s*/g, ' ');
        return;
      }
      const tag = child.nodeName;
      if (tag === 'BR') {
        out += '\n';
        return;
      }
      const inner = inline(child);
      if (!inner.trim()) {
        out += inner;
        return;
      }
      if (tag === 'B' || tag === 'STRONG') out += `**${inner}**`;
      else if (tag === 'I' || tag === 'EM') out += `*${inner}*`;
      else if (tag === 'A')
        out += `[${inner}](${(child as HTMLAnchorElement).getAttribute('href') ?? ''})`;
      else out += inner;
    });
    return out;
  };

  const out: string[] = [];
  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.nodeValue ?? '').trim();
      if (text) out.push(text);
      return;
    }
    const tag = node.nodeName;
    if (/^H[1-6]$/.test(tag)) {
      out.push(`### ${inline(node).trim()}`);
    } else if (tag === 'UL' || tag === 'OL') {
      (node as HTMLElement).querySelectorAll('li').forEach((li) => {
        const text = inline(li).trim();
        if (text) out.push(`- ${text}`);
      });
    } else if (tag === 'BR') {
      out.push('');
    } else {
      const text = inline(node).trim();
      if (text) out.push(...text.split('\n'));
    }
  });

  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/** Markdown stripped back to readable text, for the storefront preview pane. */
export const markdownToPlainText = (source: string): string =>
  String(source || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s*/gm, '')
    // Only `-` is a bullet marker here (mirrors markdownToHtml's own bullet rule): a bare leading
    // `*` is bold syntax (`**text**`), not a list item, so it must not be swallowed as one.
    .replace(/^-\s+/gm, '• ')
    .replace(/[*_`>]/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, 320);

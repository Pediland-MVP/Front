import { Fragment, type ReactNode } from 'react';

/**
 * A deliberately tiny markdown renderer for the product-description preview.
 *
 * It supports exactly the subset the design uses — `### heading`, `**bold**`, `- list`,
 * `[text](url)`, paragraphs — and nothing else.
 *
 * **It returns React elements, never an HTML string.** That is the security property, not a
 * style choice: with no `dangerouslySetInnerHTML` anywhere, injected markup cannot become live
 * DOM no matter what the merchant types, so this needs no sanitiser dependency. The only real
 * sink left is a link's href, which {@link safeHref} gates by scheme.
 *
 * The description itself is stored and sent as raw markdown; this only ever affects the preview
 * pane and the storefront's own renderer is a separate concern.
 */

/** `javascript:`, `data:` and friends never reach an href — only these two schemes do. */
export function safeHref(url: string): string | null {
  const trimmed = url.trim();
  // Relative and anchor links are fine and cannot carry a scheme.
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? trimmed : null;
  } catch {
    // Not a parseable absolute URL and not relative — refuse rather than guess.
    return null;
  }
}

const INLINE = /(\*\*[^*]+\*\*|\[[^\]]*\]\([^)]*\))/g;

/** Bold and links inside one line. Anything unmatched stays literal text. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    const link = /^\[([^\]]*)\]\(([^)]*)\)$/.exec(part);
    if (link) {
      const [, label, url] = link;
      const href = safeHref(url);
      // A rejected scheme renders as plain text — the merchant still sees what they typed,
      // it simply is not clickable.
      if (!href) return <Fragment key={key}>{label}</Fragment>;
      return (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          {label}
        </a>
      );
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}

/** Renders the supported markdown subset as React nodes. */
export function renderMarkdown(source: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  const lines = source.split('\n');
  let listBuffer: string[] = [];
  let paragraphBuffer: string[] = [];

  const flushList = () => {
    if (!listBuffer.length) return;
    const items = listBuffer;
    listBuffer = [];
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc space-y-1 ps-5">
        {items.map((item, index) => (
          <li key={index}>{renderInline(item, `li-${blocks.length}-${index}`)}</li>
        ))}
      </ul>,
    );
  };

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    const text = paragraphBuffer.join(' ');
    paragraphBuffer = [];
    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(text, `p-${blocks.length}`)}</p>);
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      flushParagraph();
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushList();
      flushParagraph();
      const level = Math.min(heading[1].length, 6);
      // Headings render at a fixed visual weight rather than as h1..h6 — this is a preview
      // inside a form, so it must not inject document-outline levels into the page.
      blocks.push(
        <p key={`h-${blocks.length}`} className={level <= 2 ? 'text-base font-bold' : 'font-bold'}>
          {renderInline(heading[2], `h-${blocks.length}`)}
        </p>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      listBuffer.push(trimmed.replace(/^[-*]\s+/, ''));
      continue;
    }

    flushList();
    paragraphBuffer.push(trimmed);
  }

  flushList();
  flushParagraph();
  return blocks;
}

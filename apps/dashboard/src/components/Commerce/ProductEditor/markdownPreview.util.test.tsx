import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { renderMarkdown, safeHref } from './markdownPreview.util';

const show = (source: string) => render(<div data-testid="out">{renderMarkdown(source)}</div>);

describe('safeHref', () => {
  it('allows http and https', () => {
    expect(safeHref('https://befroosh.app')).toBe('https://befroosh.app');
    expect(safeHref('http://befroosh.app')).toBe('http://befroosh.app');
  });

  it('allows relative and anchor links', () => {
    expect(safeHref('/products/1')).toBe('/products/1');
    expect(safeHref('#specs')).toBe('#specs');
  });

  it('rejects javascript:, data: and other schemes', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('JavaScript:alert(1)')).toBeNull();
    expect(safeHref('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(safeHref('vbscript:msgbox(1)')).toBeNull();
    expect(safeHref('file:///etc/passwd')).toBeNull();
  });

  it('rejects an unparseable value rather than guessing', () => {
    expect(safeHref('not a url')).toBeNull();
    expect(safeHref('')).toBeNull();
  });
});

describe('renderMarkdown', () => {
  it('renders a paragraph', () => {
    show('یک توضیح ساده');
    expect(screen.getByTestId('out')).toHaveTextContent('یک توضیح ساده');
  });

  it('renders bold', () => {
    const { container } = show('رویه **مش تنفسی** دارد');
    expect(container.querySelector('strong')).toHaveTextContent('مش تنفسی');
  });

  it('renders a heading as bold text, not an h1-h6', () => {
    const { container } = show('### درباره این کفش');

    expect(screen.getByTestId('out')).toHaveTextContent('درباره این کفش');
    // A preview inside a form must not inject document-outline levels into the page.
    expect(container.querySelector('h1,h2,h3,h4,h5,h6')).toBeNull();
  });

  it('renders a bullet list, grouping consecutive items into one ul', () => {
    const { container } = show('- مناسب دویدن\n- وزن ۲۸۰ گرم');

    expect(container.querySelectorAll('ul')).toHaveLength(1);
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('starts a new block after a blank line', () => {
    const { container } = show('اول\n\n- مورد');

    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(container.querySelectorAll('ul')).toHaveLength(1);
  });

  it('renders a safe link with noopener', () => {
    const { container } = show('[سایت](https://befroosh.app)');
    const anchor = container.querySelector('a');

    expect(anchor).toHaveAttribute('href', 'https://befroosh.app');
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
  });

  // The core security property: a rejected scheme must never reach an href.
  it('degrades a javascript: link to plain text instead of a clickable anchor', () => {
    const { container } = show('[کلیک](javascript:alert(1))');

    expect(container.querySelector('a')).toBeNull();
    expect(screen.getByTestId('out')).toHaveTextContent('کلیک');
  });

  // Structural immunity: raw markup is text because nothing is ever parsed as HTML.
  it('renders raw HTML as literal text, never as live DOM', () => {
    const { container } = show('<script>alert(1)</script><img src=x onerror=alert(1)>');

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByTestId('out')).toHaveTextContent('<script>alert(1)</script>');
  });

  it('leaves an unterminated bold marker as literal text', () => {
    show('**بدون پایان');
    expect(screen.getByTestId('out')).toHaveTextContent('**بدون پایان');
  });

  it('renders nothing for empty or whitespace-only input', () => {
    expect(renderMarkdown('')).toEqual([]);
    expect(renderMarkdown('   \n\n  ')).toEqual([]);
  });
});

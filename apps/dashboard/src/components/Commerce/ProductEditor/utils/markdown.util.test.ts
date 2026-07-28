import { describe, it, expect } from 'vitest';
import { markdownToHtml, htmlToMarkdown, markdownToPlainText } from './markdown.util';

const render = (html: string): HTMLElement => {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host;
};

describe('markdownToHtml', () => {
  it('renders headings, bold, italic and bullets', () => {
    const html = markdownToHtml('### سرتیتر\nمتن **درشت** و *مورب*\n- یک\n- دو', 'خالی');
    expect(html).toContain('<h3>سرتیتر</h3>');
    expect(html).toContain('<strong>درشت</strong>');
    expect(html).toContain('<em>مورب</em>');
    expect(html).toContain('<li>یک</li>');
  });

  it('shows the empty placeholder when there is nothing to render', () => {
    expect(markdownToHtml('', 'هنوز چیزی نوشته نشده.')).toContain('هنوز چیزی نوشته نشده.');
  });

  it('escapes raw HTML instead of executing it', () => {
    const html = markdownToHtml('<img src=x onerror=alert(1)>', 'خالی');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('neuters a javascript: link but keeps its label', () => {
    const html = markdownToHtml('[کلیک](javascript:alert(1))', 'خالی');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('کلیک');
  });

  it('does not let a quote in an href break out of the attribute', () => {
    const html = markdownToHtml('[x](https://a" onmouseover="alert(1))', 'خالی');
    expect(html).not.toContain('onmouseover=');
  });

  it('keeps a normal https link', () => {
    const html = markdownToHtml('[سایت](https://befroosh.app)', 'خالی');
    expect(html).toContain('href="https://befroosh.app"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});

describe('htmlToMarkdown', () => {
  it('round-trips headings, bold and bullets', () => {
    const md = htmlToMarkdown(
      render('<h3>سرتیتر</h3><p>متن <strong>درشت</strong></p><ul><li>یک</li></ul>'),
    );
    expect(md).toBe('### سرتیتر\nمتن **درشت**\n- یک');
  });

  it('keeps a link as markdown', () => {
    const md = htmlToMarkdown(render('<p><a href="https://x.ir">لینک</a></p>'));
    expect(md).toBe('[لینک](https://x.ir)');
  });
});

describe('markdownToPlainText', () => {
  it('strips the markup for the storefront preview', () => {
    expect(markdownToPlainText('### تیتر\n- یک\n**درشت**')).toBe('تیتر\n• یک\nدرشت');
  });
});

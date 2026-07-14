const ALLOWED_URL_SCHEMES = new Set(['http:', 'https:']);

// Blocks javascript:/data:/etc. URIs in href/src while still allowing relative paths.
export function sanitizeUrl(url: string): string {
  const trimmed = (url ?? '').trim();
  if (!trimmed) return '#';

  try {
    const parsed = new URL(trimmed, 'https://relative-url-base.invalid');
    return ALLOWED_URL_SCHEMES.has(parsed.protocol) ? trimmed : '#';
  } catch {
    return '#';
  }
}

// Escapes every character with HTML significance (including quotes) so markdown
// content can never break out of a generated tag's attribute value.
export function escapeMarkdownHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Hand-rolled Markdown -> HTML used for admin-authored guide content rendered via
// dangerouslySetInnerHTML. Every character with HTML significance (including quotes)
// is escaped up front so no markdown content can break out of a generated tag's
// attribute value; only our own static template strings ever contribute markup.
export function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  let html = escapeMarkdownHtml(markdown);

  // Restore allowed span tags for colors (like <span style="color: ...">...</span>)
  html = html.replace(
    /&lt;span\s+style=&quot;color:\s*(#[0-9a-fA-F]{3,6}|[a-zA-Z]+);?&quot;&gt;([\s\S]*?)&lt;\/span&gt;/gi,
    (_match, color, content) => `<span style="color: ${color}">${content}</span>`,
  );

  // Headers
  html = html.replace(
    /^# (.*?)$/gm,
    '<h1 class="text-xl md:text-2xl font-black my-5 text-slate-800 border-b pb-2 border-slate-100">$1</h1>',
  );
  html = html.replace(
    /^## (.*?)$/gm,
    '<h2 class="text-lg md:text-xl font-bold my-4 text-slate-800 border-b pb-1 border-slate-50">$1</h2>',
  );
  html = html.replace(
    /^### (.*?)$/gm,
    '<h3 class="text-base md:text-lg font-bold my-3 text-slate-800">$1</h3>',
  );

  // Bold / Italic
  html = html.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-extrabold text-slate-900">$1</strong>',
  );
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>');

  // Code block
  html = html.replace(
    /```([\s\S]*?)```/g,
    '<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-sm overflow-auto my-4 shadow-inner" dir="ltr">$1</pre>',
  );

  // Inline code
  html = html.replace(
    /`(.*?)`/g,
    '<code class="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-xs" dir="ltr">$1</code>',
  );

  // Blockquote
  html = html.replace(
    /^&gt; (.*?)$/gm,
    '<blockquote class="border-r-4 border-blue-500 pr-4 pl-2 py-2 bg-blue-50/40 rounded-l-lg my-4 italic text-slate-600">$1</blockquote>',
  );

  // Controlled Image sizes inside learning articles (max width 28rem/md centered)
  html = html.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    (_match, alt, url) =>
      `<img src="${sanitizeUrl(url)}" alt="${alt}" class="rounded-2xl max-w-full md:max-w-md mx-auto block my-6 shadow-md border border-slate-200/50 object-contain hover:scale-[1.01] duration-300 transition-transform" />`,
  );

  // Links
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    (_match, text, url) =>
      `<a href="${sanitizeUrl(url)}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline hover:text-blue-800 font-semibold transition-colors">${text}</a>`,
  );

  // Lists
  html = html.replace(
    /^\s*-\s+(.*?)$/gm,
    '<li class="list-disc list-inside mr-4 my-1.5 text-slate-700">$1</li>',
  );

  // Newlines to paragraph breaks (if not inside list/header tags)
  const lines = html.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<li') ||
      trimmed.startsWith('<blockquote') ||
      trimmed.startsWith('<pre') ||
      trimmed.startsWith('<img') ||
      trimmed.startsWith('<p')
    ) {
      return line;
    }
    return `<p class="my-2.5 leading-relaxed text-slate-600 text-sm md:text-base">${line}</p>`;
  });

  return processedLines.join('\n');
}

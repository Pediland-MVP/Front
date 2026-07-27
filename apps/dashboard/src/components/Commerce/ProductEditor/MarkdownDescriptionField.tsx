'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BoldIcon, HeadingIcon, ItalicIcon, LinkIcon, ListIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import e2pNumbers from '@/utils/e2pNumber';

import { renderMarkdown } from './markdownPreview.util';

type Wrap = { before: string; after: string };

const BOLD: Wrap = { before: '**', after: '**' };
const ITALIC: Wrap = { before: '*', after: '*' };
const LINK: Wrap = { before: '[', after: '](https://)' };

/**
 * Markdown description editor: a write/preview toggle plus a formatting toolbar, drawn as the
 * design's three bands — toolbar strip, body, footer count.
 *
 * The design's own editor is a `contentEditable` that formats in place. We keep a plain textarea
 * over raw markdown instead, because `contentEditable` hands you back browser-generated HTML,
 * which would have to be sanitised before it could ever be stored or re-rendered. The stored
 * value here is always the text the merchant typed, and the preview is render-only — toggling to
 * preview and back cannot alter it.
 */
export const MarkdownDescriptionField = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) => {
  const t = useTranslations('Commerce.Editor.Basic');
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Wraps the selection (or drops a placeholder at the caret) and restores focus. */
  const wrapSelection = ({ before, after }: Wrap, placeholder: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end) || placeholder;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    // Re-select the inner text so typing immediately replaces the placeholder.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  /** Prefixes each line the selection touches — headings and bullets are line-level. */
  const prefixLines = (prefix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end);
    const block = value.slice(lineStart, lineEnd) || '';
    const prefixed = block
      .split('\n')
      .map((line) => (line.startsWith(prefix) ? line : `${prefix}${line}`))
      .join('\n');
    onChange(`${value.slice(0, lineStart)}${prefixed}${value.slice(lineEnd)}`);
    requestAnimationFrame(() => el.focus());
  };

  const toolbar = [
    { key: 'bold', icon: BoldIcon, run: () => wrapSelection(BOLD, t('mdBoldPlaceholder')) },
    { key: 'italic', icon: ItalicIcon, run: () => wrapSelection(ITALIC, t('mdItalicPlaceholder')) },
    { key: 'heading', icon: HeadingIcon, run: () => prefixLines('### ') },
    { key: 'list', icon: ListIcon, run: () => prefixLines('- ') },
    { key: 'link', icon: LinkIcon, run: () => wrapSelection(LINK, t('mdLinkPlaceholder')) },
  ] as const;

  return (
    <div className="border-ln bg-card overflow-hidden rounded-2xl border shadow-xs">
      <div className="bg-muted border-lnv flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
        {(['write', 'preview'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={tab === mode}
            data-testid={`md-tab-${mode}`}
            onClick={() => setTab(mode)}
            className={cn(
              'h-[30px] rounded-md px-2.5 text-xs font-bold transition-colors',
              tab === mode
                ? 'bg-card text-primary shadow-xs'
                : 'text-mut hover:text-foreground hover:bg-card/60',
            )}
          >
            {t(mode === 'write' ? 'mdWrite' : 'mdPreview')}
          </button>
        ))}

        {tab === 'write' && !disabled && (
          <>
            <span aria-hidden="true" className="bg-lnv mx-1 h-5 w-px" />
            {toolbar.map(({ key, icon: Icon, run }) => (
              <button
                key={key}
                type="button"
                aria-label={t(`md${key[0].toUpperCase()}${key.slice(1)}` as never)}
                title={t(`md${key[0].toUpperCase()}${key.slice(1)}` as never)}
                data-testid={`md-${key}`}
                onClick={run}
                className="border-ln bg-card hover:bg-tint grid h-[30px] w-8 place-items-center rounded-md border transition-colors"
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </>
        )}
      </div>

      {tab === 'write' ? (
        <textarea
          ref={textareaRef}
          rows={7}
          disabled={disabled}
          data-testid="md-textarea"
          aria-label={t('description')}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('mdPlaceholder')}
          className="bg-card min-h-[170px] w-full resize-y px-3.5 py-3.5 font-mono text-sm leading-7 outline-none disabled:opacity-60"
        />
      ) : (
        <div
          data-testid="md-preview"
          className={cn(
            'min-h-[170px] space-y-2 px-3.5 py-3.5 text-sm leading-7',
            !value.trim() && 'text-mut',
          )}
        >
          {value.trim() ? renderMarkdown(value) : t('mdPreviewEmpty')}
        </div>
      )}

      <div className="bg-muted border-lnv text-mut border-t px-3 py-2 text-xs">
        {t('mdCount', { count: e2pNumbers(String(value.length)) })}
      </div>
    </div>
  );
};

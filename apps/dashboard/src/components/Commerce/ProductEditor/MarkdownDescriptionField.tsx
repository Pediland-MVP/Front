'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BoldIcon, HeadingIcon, LinkIcon, ListIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, Textarea } from '@/components/ui';

import { renderMarkdown } from './markdownPreview.util';

type Wrap = { before: string; after: string };

const BOLD: Wrap = { before: '**', after: '**' };
const LINK: Wrap = { before: '[', after: '](https://)' };

/**
 * Markdown description editor: a write/preview toggle plus a small formatting toolbar.
 *
 * The stored value stays raw markdown — the preview is render-only and never writes back, so
 * toggling to preview and away cannot alter what the merchant typed.
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
    { key: 'link', icon: LinkIcon, run: () => wrapSelection(LINK, t('mdLinkPlaceholder')) },
    { key: 'heading', icon: HeadingIcon, run: () => prefixLines('### ') },
    { key: 'list', icon: ListIcon, run: () => prefixLines('- ') },
  ] as const;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {(['write', 'preview'] as const).map((mode) => (
          <Button
            key={mode}
            type="button"
            size="sm"
            variant={tab === mode ? 'secondary' : 'ghost'}
            aria-pressed={tab === mode}
            data-testid={`md-tab-${mode}`}
            onClick={() => setTab(mode)}
          >
            {t(mode === 'write' ? 'mdWrite' : 'mdPreview')}
          </Button>
        ))}

        {tab === 'write' && !disabled && (
          <div className="ms-2 flex items-center gap-1">
            {toolbar.map(({ key, icon: Icon, run }) => (
              <Button
                key={key}
                type="button"
                size="icon"
                variant="ghost"
                aria-label={t(`md${key[0].toUpperCase()}${key.slice(1)}` as never)}
                data-testid={`md-${key}`}
                onClick={run}
                className="size-8"
              >
                <Icon className="size-4" />
              </Button>
            ))}
          </div>
        )}
      </div>

      {tab === 'write' ? (
        <Textarea
          ref={textareaRef}
          rows={7}
          disabled={disabled}
          data-testid="md-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm"
        />
      ) : (
        <div
          data-testid="md-preview"
          className={cn(
            'min-h-40 space-y-2 rounded-md border p-3 text-sm',
            !value.trim() && 'text-muted-foreground',
          )}
        >
          {value.trim() ? renderMarkdown(value) : t('mdPreviewEmpty')}
        </div>
      )}
    </div>
  );
};

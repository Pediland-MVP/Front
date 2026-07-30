'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useFormContext, useWatch } from 'react-hook-form';
import { BoldIcon, HeadingIcon, ItalicIcon, LinkIcon, ListIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import e2pNumbers from '@/utils/e2pNumber';

import type { ProductFormValues } from '../productEditor.schema';
import { htmlToMarkdown, markdownToHtml } from '../utils/markdown.util';
import { editorCard } from '../ui/editorChrome';
import { EditorSection } from '../ui/EditorSection';

/**
 * Step ۲ — the description, edited WYSIWYG and STORED AS MARKDOWN.
 *
 * A contentEditable is not a React-controlled input and must not be treated as one. If the
 * surface's innerHTML were re-rendered from state on every keystroke, the browser would rebuild
 * the DOM under the caret and the caret would jump to the start on every character — the classic
 * contentEditable bug.
 *
 * So the data flows one way at a time, arbitrated by `lastPushed`:
 *
 *   - PULL (typing): on input/blur, read the DOM once, convert to markdown, write it to the form,
 *     and record it in `lastPushed`.
 *   - PUSH (something else changed the value — a form reset after load or after Save, a revert):
 *     the watched value no longer equals `lastPushed`, so write innerHTML once.
 *
 * Because a pull always records what it just wrote, the effect that follows the merchant's own
 * keystroke sees `lastPushed === description` and does nothing. Only a change that did NOT come
 * from this surface gets pushed back in.
 */
export const DescriptionSection = ({ step = 2 }: { step?: number }) => {
  const t = useTranslations('Commerce.Editor.Description');
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  const surfaceRef = useRef<HTMLDivElement>(null);
  /** The markdown this component last wrote INTO or read OUT OF the surface. */
  const lastPushed = useRef<string | null>(null);

  const description = useWatch({ control, name: 'description' }) ?? '';

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    // Our own keystroke — the DOM is already right; touching it would move the caret.
    if (lastPushed.current === description) return;
    surface.innerHTML = description.trim() ? markdownToHtml(description, '') : '';
    lastPushed.current = description;
  }, [description]);

  const pull = useCallback(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const markdown = htmlToMarkdown(surface);
    lastPushed.current = markdown;
    setValue('description', markdown, { shouldDirty: true });
  }, [setValue]);

  /**
   * `document.execCommand` is formally deprecated and has no replacement for in-place rich-text
   * editing. Every alternative is a third-party editor; the design's toolbar is five buttons over
   * a markdown subset, which does not justify one.
   */
  const exec = (command: string, value?: string) => {
    surfaceRef.current?.focus();
    document.execCommand(command, false, value);
    pull();
  };

  const promptLink = () => {
    const url = window.prompt(t('linkPrompt'), 'https://');
    if (!url) return;
    // `markdownToHtml`'s `safeHref` drops any non-http(s) scheme on the way back out, so a
    // javascript: url typed here cannot survive a round trip.
    exec('createLink', url);
  };

  const tools = [
    { key: 'bold', label: t('bold'), Icon: BoldIcon, run: () => exec('bold') },
    { key: 'italic', label: t('italic'), Icon: ItalicIcon, run: () => exec('italic') },
    {
      key: 'heading',
      label: t('heading'),
      Icon: HeadingIcon,
      run: () => exec('formatBlock', '<h3>'),
    },
    { key: 'list', label: t('list'), Icon: ListIcon, run: () => exec('insertUnorderedList') },
    { key: 'link', label: t('link'), Icon: LinkIcon, run: promptLink },
  ] as const;

  return (
    <EditorSection bare step={step} title={t('title')} hint={t('hint')}>
      <div className={cn(editorCard, 'overflow-hidden')}>
        <div className="bg-muted border-lnv flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
          {tools.map(({ key, label, Icon, run }) => (
            <button
              key={key}
              type="button"
              title={label}
              aria-label={label}
              data-testid={`md-${key}`}
              onMouseDown={(e) => e.preventDefault()} // keep the selection while the button takes focus
              onClick={run}
              className="border-ln bg-card hover:bg-tint grid h-[30px] w-8 place-items-center rounded-md border transition-colors"
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>

        <div className="relative">
          <div
            ref={surfaceRef}
            contentEditable
            suppressContentEditableWarning
            data-prose="1"
            data-testid="md-surface"
            data-bad={errors.description ? 'empty' : undefined}
            role="textbox"
            aria-multiline="true"
            aria-invalid={errors.description ? true : undefined}
            aria-label={t('title')}
            onInput={pull}
            onBlur={pull}
            className="bg-card min-h-[170px] px-3.5 py-3.5 text-sm leading-8 outline-none focus:shadow-[inset_0_0_0_2px_var(--primary)]"
          />
          {!description.trim() && (
            // A contentEditable cannot carry a `placeholder`, and `:empty::before` breaks the
            // moment the browser drops a stray <br> in. An overlay is the honest version.
            <span className="text-mut pointer-events-none absolute start-3.5 top-3.5 text-sm">
              {t('placeholder')}
            </span>
          )}
        </div>

        <div
          className={cn(
            'border-lnv border-t px-3 py-2 text-xs',
            errors.description ? 'bg-dtint text-dtext' : 'bg-muted text-mut',
          )}
        >
          {errors.description?.message ??
            t('count', { count: e2pNumbers(String(description.length)) })}
        </div>
      </div>
    </EditorSection>
  );
};

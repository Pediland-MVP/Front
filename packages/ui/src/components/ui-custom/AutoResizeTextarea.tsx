'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Textarea } from '../ui/textarea';

export interface AutoResizeTextareaProps extends React.ComponentProps<'textarea'> {
  /** Height floor, in rows. The field never renders shorter than this. */
  minRows?: number;
  /** Height ceiling, in rows. Past this the field scrolls internally. */
  maxRows?: number;
}

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ className, minRows = 4, maxRows = 12, value, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    // Tracks the element's own last-observed width so the ResizeObserver callback can
    // ignore the resizes it causes itself (our height writes never change width, but a
    // scrollbar toggling on/off can shave off a few px — bail if width truly didn't move).
    const lastWidth = React.useRef(0);

    const resize = React.useCallback(() => {
      const el = innerRef.current;
      if (!el) return;

      const style = window.getComputedStyle(el);

      // `line-height: normal` resolves to an empty string here; 1.2 is the CSS default ratio.
      let lineHeight = parseFloat(style.lineHeight);
      if (Number.isNaN(lineHeight)) lineHeight = parseFloat(style.fontSize) * 1.2;

      const borders =
        (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0);
      // scrollHeight already includes padding but excludes borders; the box is border-box.
      const chrome =
        (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0) + borders;

      const minHeight = lineHeight * minRows + chrome;
      const maxHeight = lineHeight * maxRows + chrome;

      // Reset first: scrollHeight can never report less than the current height.
      el.style.height = 'auto';
      const contentHeight = el.scrollHeight + borders;

      el.style.height = `${Math.min(Math.max(contentHeight, minHeight), maxHeight)}px`;
      el.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';

      lastWidth.current = el.clientWidth;
    }, [minRows, maxRows]);

    React.useLayoutEffect(() => {
      resize();
    }, [resize, value]);

    // Text wrapping depends on width too. A sidebar toggle, orientation change, or window
    // resize can shrink the field with no `value` change — while under the cap the field is
    // `overflow-y: hidden`, so without this the extra wrapped lines become unreachable until
    // the next keystroke. This effect (not useLayoutEffect) subscribes the observer; the
    // callback itself calls the same `resize()` used above, so there is one measurement path.
    React.useEffect(() => {
      const el = innerRef.current;
      if (!el || typeof ResizeObserver === 'undefined') return;

      const observer = new ResizeObserver(() => {
        if (el.clientWidth === lastWidth.current) return; // our own height writes, ignore
        resize();
      });
      observer.observe(el);

      return () => observer.disconnect();
    }, [resize]);

    return (
      <Textarea
        ref={setRefs}
        value={value}
        className={cn('min-h-0 resize-none', className)}
        {...props}
      />
    );
  },
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';

export { AutoResizeTextarea };

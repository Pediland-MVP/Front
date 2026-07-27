import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import e2pNumbers from '@/utils/e2pNumber';

import { editorCard } from './editorChrome';

/**
 * One numbered step of the product form: a heading row with a round step badge, then the card.
 *
 * The design replaced the old `CardHeader`/`CardTitle` with this — the heading sits OUTSIDE the
 * card, so a merchant scrolling a long single-page form can see how far along they are. The step
 * number is rendered in Persian digits because the whole surface is RTL Persian and a lone latin
 * "3" beside "دسته‌بندی" reads as a typo.
 */
export const EditorSection = ({
  step,
  title,
  hint,
  bare,
  className,
  cardClassName,
  children,
  ...rest
}: {
  step: number;
  title: string;
  /** Optional grey note beside the title — a count, or a one-line explanation. */
  hint?: ReactNode;
  /** Render children without the card shell, for sections that draw their own (e.g. a table). */
  bare?: boolean;
  className?: string;
  cardClassName?: string;
  children: ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, 'title'>) => (
  <section className={cn('min-w-0', className)} {...rest}>
    <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
      <span
        aria-hidden="true"
        className="bg-tint2 text-primary grid size-6 flex-none place-items-center rounded-full text-xs font-extrabold"
      >
        {e2pNumbers(String(step))}
      </span>
      <h2 className="text-base font-bold">{title}</h2>
      {hint ? <span className="text-mut text-xs">{hint}</span> : null}
    </div>
    {bare ? children : <div className={cn(editorCard, 'p-4', cardClassName)}>{children}</div>}
  </section>
);

/**
 * A right-rail card: its own title band, a body, and an optional footer band. Used by the
 * Collections and Tags panels, which the design moves out of the main flow and into the sidebar.
 */
export const EditorRailCard = ({
  title,
  count,
  footer,
  children,
}: {
  title: string;
  count?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) => (
  <div className={cn(editorCard, 'overflow-hidden')}>
    <div className="border-lnv flex items-baseline gap-2 border-b px-3.5 py-3">
      <h2 className="flex-1 text-sm font-bold">{title}</h2>
      {count !== undefined && <span className="text-mut text-xs">{count}</span>}
    </div>
    <div className="flex flex-col gap-2.5 px-3 py-3">{children}</div>
    {footer && <div className="bg-muted border-lnv border-t px-3 py-2.5">{footer}</div>}
  </div>
);

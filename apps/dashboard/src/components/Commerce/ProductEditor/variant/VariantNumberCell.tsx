'use client';

import { useEffect, useRef } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';

// NAMED import: the DEFAULT export of this module is `p2eNumbers` (a string→string cleaner),
// the named `onInputP2EHandler` is the event handler this cell needs (CLAUDE.md §18).
import { onInputP2EHandler } from '@/utils/p2eNumber';

import type { ProductFormValues } from '../productEditor.schema';
import { formatAmount, parseAmount } from '../utils/editorNumber.util';

export type VariantCellField = 'price' | 'compare' | 'stock';

/** `''` = fine, `'empty'` = red tint (missing), `'zero'` = amber tint (present but wrong). */
export type VariantCellTone = '' | 'empty' | 'zero';

export interface VariantNumberCellProps {
  index: number;
  field: VariantCellField;
  /** Current form value for this cell, handed down by the row that watches it. */
  value: number | null;
  tone: VariantCellTone;
  ariaLabel: string;
  placeholder: string;
  disabled?: boolean;
  /** Overrides the rendered text — `∞` for an untracked-stock row. */
  display?: string;
  className?: string;
  /** Enter / ArrowDown → +1, ArrowUp → -1. The section owns the visible row order. */
  onNavigate?: (direction: 1 | -1) => void;
  /** Ctrl/Cmd+D — copy this value down the rest of the group. */
  onFillDown?: () => void;
}

/**
 * One numeric cell of the grid, wired straight into react-hook-form with `register`.
 *
 * `register` is what makes 2000 rows survivable: the input is UNCONTROLLED, so a keystroke here
 * updates form state without re-rendering React at all. That is also why the DOM value has to be
 * synced by hand when the value changes from OUTSIDE (a roll-up commit, a bulk edit, fill-down) —
 * an uncontrolled input ignores a new `defaultValue`.
 *
 * Text input + `inputMode="numeric"` + `onInput={onInputP2EHandler}`, never `type="number"`
 * (CLAUDE.md §18): `type="number"` blanks Persian digits before they can be converted.
 */
export function VariantNumberCell({
  index,
  field,
  value,
  tone,
  ariaLabel,
  placeholder,
  disabled,
  display,
  className,
  onNavigate,
  onFillDown,
}: VariantNumberCellProps) {
  const { register, setValue, getValues, control } = useFormContext<ProductFormValues>();
  const name = `variants.${index}.${field}` as const;

  // Name-scoped: this cell re-renders on ITS OWN error appearing, not on any other row's.
  const { errors } = useFormState({ control, name });
  const hasError = Boolean(errors?.variants?.[index]?.[field]);
  // A zod issue tints with the tone that field's failure means: a missing price is red, a
  // compare/stock that is present but wrong is amber.
  const shown: VariantCellTone = hasError ? (field === 'price' ? 'empty' : 'zero') : tone;

  const registration = register(name, { setValueAs: (raw) => parseAmount(String(raw ?? '')) });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const text = display ?? formatAmount(value);
  const writtenRef = useRef<string>(text);
  // Value at focus time — Escape puts exactly this back, in the form and in the DOM.
  const focusValueRef = useRef<number | null>(value);

  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    // Never fight the merchant's own typing.
    if (document.activeElement === element) return;
    const next = display ?? formatAmount(value);
    if (next === writtenRef.current) return;
    element.value = next;
    writtenRef.current = next;
  }, [display, value]);

  return (
    <input
      {...registration}
      ref={(element) => {
        registration.ref(element);
        inputRef.current = element;
      }}
      defaultValue={text}
      type="text"
      inputMode="numeric"
      dir="ltr"
      disabled={disabled}
      data-bad={shown || undefined}
      aria-invalid={hasError || undefined}
      aria-label={ariaLabel}
      placeholder={placeholder}
      className={
        className ??
        'bg-card border-ln focus:border-primary h-[34px] w-full min-w-0 rounded-md border px-2 text-xs font-bold outline-none disabled:opacity-60'
      }
      onInput={onInputP2EHandler}
      onFocus={(event) => {
        focusValueRef.current = value;
        event.target.select();
      }}
      onBlur={(event) => {
        void registration.onBlur(event);
        // Rest state shows the formatted number; typing strips the separators again via p2e.
        const committed = getValues(name) as number | null;
        const formatted = formatAmount(committed);
        event.target.value = formatted;
        writtenRef.current = formatted;
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          setValue(name, focusValueRef.current);
          const reverted = formatAmount(focusValueRef.current);
          event.currentTarget.value = reverted;
          writtenRef.current = reverted;
          event.currentTarget.blur();
          return;
        }
        if ((event.ctrlKey || event.metaKey) && (event.key === 'd' || event.key === 'D')) {
          event.preventDefault();
          onFillDown?.();
          return;
        }
        if (event.key === 'Enter' || event.key === 'ArrowDown') {
          event.preventDefault();
          onNavigate?.(1);
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          onNavigate?.(-1);
        }
      }}
    />
  );
}

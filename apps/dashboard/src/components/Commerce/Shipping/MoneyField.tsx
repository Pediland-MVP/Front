'use client';

import { cn } from '@/lib/utils';
import { useSelectOnFocus } from '@/hooks/useSelectOnFocus';
import { onInputP2EHandler } from '@/utils/p2eNumber';

import { editorInput, editorInputSm } from '../ProductEditor/ui/editorChrome';
import { formatAmount, parseAmount } from '../ProductEditor/utils/editorNumber.util';

interface MoneyFieldProps {
  value: number | null;
  onChange: (next: number | null) => void;
  /** Every field here is unlabelled or labelled elsewhere, so the aria label is required. */
  ariaLabel: string;
  /** Currency word rendered inside the field, e.g. تومان. */
  unit: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: 'md' | 'sm';
  className?: string;
}

/**
 * A price box. Four of them appear on this screen (base price, free-shipping threshold, the new
 * exception's price, and each saved exception's price), so the §18 rules live in one place:
 *
 * - a TEXT input with `inputMode="numeric"`, never `type="number"` — a number input blanks Persian
 *   digits before they can be converted, so nothing the merchant types would survive;
 * - `onInput={onInputP2EHandler}`, which converts ۰-۹ to 0-9 *before* React's `onChange` reads it;
 * - `parseAmount`/`formatAmount` from the product editor, so a price is separated and rendered the
 *   same way everywhere in commerce.
 *
 * The unit sits inside the box as `pointer-events-none` text rather than as a suffix addon: the
 * design shows it inside the field, and a real element there would steal the click that should
 * focus the input.
 */
export const MoneyField = ({
  value,
  onChange,
  ariaLabel,
  unit,
  id,
  placeholder,
  disabled,
  size = 'md',
  className,
}: MoneyFieldProps) => {
  const selectOnFocus = useSelectOnFocus();
  const small = size === 'sm';

  return (
    <div className={cn('relative', className)}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        aria-label={ariaLabel}
        placeholder={placeholder}
        disabled={disabled}
        {...selectOnFocus}
        onInput={onInputP2EHandler}
        value={formatAmount(value)}
        onChange={(e) => onChange(parseAmount(e.target.value))}
        className={cn(
          small ? editorInputSm : editorInput,
          'font-bold',
          small ? 'ps-2.5 pe-11' : 'ps-3 pe-14',
        )}
      />
      <span
        className={cn(
          'text-mut pointer-events-none absolute inset-y-0 flex items-center',
          small ? 'end-2.5 text-[11px]' : 'end-3 text-xs',
        )}
      >
        {unit}
      </span>
    </div>
  );
};

'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';

import { onInputP2EHandler } from '@/utils/p2eNumber';
import { formatNumber } from '@/utils/formatNumber';
import { useSelectOnFocus } from '@/hooks/useSelectOnFocus';

import { cn } from '@/lib/utils';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui';

import { EditorSection } from '../ui/EditorSection';
import { editorInput } from '../ui/editorChrome';
import type { ProductFormValues } from '../productForm.schema';

/**
 * Product-level `shippingCost` only — no free-shipping-threshold toggle (spec correction
 * item 10: that field doesn't exist on `CommerceProduct`, so there's nothing to bind it to).
 */
export const ShippingSection = ({ step }: { step: number }) => {
  const t = useTranslations('Commerce.Editor');
  const form = useFormContext<ProductFormValues>();
  const { onFocus } = useSelectOnFocus();

  return (
    <EditorSection step={step} title={t('Nav.shipping')}>
      <FormField
        control={form.control}
        name="shippingCost"
        render={({ field }) => (
          <FormItem className="space-y-0">
            <FormLabel className="text-mut mb-1.5 block text-xs font-bold">
              {t('Shipping.shippingCost')}
            </FormLabel>
            <FormControl>
              <input
                inputMode="numeric"
                onInput={onInputP2EHandler}
                aria-label={t('Shipping.shippingCost')}
                placeholder="۰"
                value={formatNumber(field.value) ?? ''}
                onFocus={onFocus}
                onChange={(e) => field.onChange(e.target.value === '' ? 0 : +e.target.value)}
                className={cn(editorInput, 'max-w-64 font-bold')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </EditorSection>
  );
};

'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';

import { onInputP2EHandler } from '@/utils/p2eNumber';
import { formatNumber } from '@/utils/formatNumber';
import { useSelectOnFocus } from '@/hooks/useSelectOnFocus';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/components/ui';

import type { ProductFormValues } from '../productForm.schema';

/**
 * Product-level `shippingCost` only — no free-shipping-threshold toggle (spec correction
 * item 10: that field doesn't exist on `CommerceProduct`, so there's nothing to bind it to).
 */
export const ShippingSection = () => {
  const t = useTranslations('Commerce.Editor');
  const form = useFormContext<ProductFormValues>();
  const { onFocus } = useSelectOnFocus();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Nav.shipping')}</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="shippingCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Shipping.shippingCost')}</FormLabel>
              <FormControl>
                <Input
                  onInput={onInputP2EHandler}
                  placeholder="۰"
                  value={formatNumber(field.value)}
                  onFocus={onFocus}
                  onChange={(e) => field.onChange(+e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

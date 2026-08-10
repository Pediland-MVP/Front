'use client';

import { useSelectOnFocus } from '@/hooks/useSelectOnFocus';
import { formatNumber } from '@/utils/formatNumber';
import { onInputP2EHandler } from '@/utils/p2eNumber';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { TruckIcon } from '@phosphor-icons/react/dist/ssr/Truck';

export const FormShippingCost = () => {
  const { control, watch, setValue } = useFormContext();
  const t = useTranslations('Products.Form.Product');
  const { onFocus } = useSelectOnFocus();

  useEffect(() => {
    if (watch('isDigital')) {
      setValue('shippingCost', 0);
    }
  }, [watch('isDigital')]);

  if (watch('isDigital')) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <TruckIcon weight="duotone" />
          {t('shipping_cost_title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="shippingCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('shipping_cost_label')}</FormLabel>
              <Input
                value={formatNumber(field.value)}
                onChange={(e) => field.onChange(+e.target.value)}
                onInput={onInputP2EHandler}
                onFocus={onFocus}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

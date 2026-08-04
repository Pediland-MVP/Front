'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ShippingInfoProps {
  shippingCost: number | null | undefined;
}

export function ShippingInfo({ shippingCost }: ShippingInfoProps) {
  const [isVisible, setIsVisible] = useState(false);
  const t = useTranslations('Checkout.ShippingInfo');

  useEffect(() => {
    // Animation effect when component mounts
    setIsVisible(true);
  }, []);

  if (!shippingCost) {
    return null;
  }

  return (
    <div className={`transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'} my-4`}>
      <Card className="border-dashed border-blue-100 bg-blue-50/50 p-0 shadow-none">
        <CardContent className="p-4">
          <div className="text-secondary flex flex-col items-start gap-2 text-sm md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-1">
              <span className="font-medium">{t('shippingMethod')}:</span>
              <span>{t('postCompany')}</span>
            </div>

            <div className="flex items-center justify-between gap-1">
              <span className="font-medium">{t('shippingCost')}:</span>
              {shippingCost && shippingCost > 0 ? (
                <div className="flex items-center gap-1">
                  <span className="font-bold">{shippingCost.toLocaleString()}</span>
                  <span>{t('toman')}</span>
                </div>
              ) : (
                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-600">
                  {t('freeShipping')}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

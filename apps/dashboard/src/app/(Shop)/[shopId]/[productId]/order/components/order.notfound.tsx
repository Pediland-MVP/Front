import { Card } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function OrderNotfound() {
  const t = useTranslations('Checkout');

  return (
    <Card className="_checkout-notfound flex min-h-80 items-center justify-center rounded-lg border">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/images/emojies/emj-02.webp"
          alt="404"
          width={90}
          height={90}
          className="mx-auto"
        />
        <p className="w-2/3 text-center font-medium">{t('orderInvalid')}</p>
      </div>
    </Card>
  );
}

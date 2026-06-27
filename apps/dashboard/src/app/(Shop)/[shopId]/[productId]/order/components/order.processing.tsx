import { CheckCircle, CheckCircleIcon } from '@phosphor-icons/react/dist/ssr';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function OrderProcessing() {
  const t = useTranslations('Checkout');
  return (
    <div className="_checkout mt-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border bg-white p-8 md:p-10">
      <CheckCircleIcon weight="duotone" className="text-green-600" size={40} />
      <p className="text-center text-green-600">{t('orderProcessingDescription')}</p>
    </div>
  );
}

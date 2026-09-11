import { CloudXIcon } from '@phosphor-icons/react/dist/ssr/CloudX';
import { useTranslations } from 'next-intl';

interface NoDataErrorProps {
  /**
   * Overrides the generic `ERROR_CODES.FETCH_DATA` copy. Screens that know WHAT failed should say
   * so -- "دریافت سفارش‌ها انجام نشد" beats a bare "خطا در دریافت اطلاعات" when a seller is
   * staring at an empty orders grid. Optional, so the seven existing `<NoDataError />` call sites
   * keep their current text unchanged.
   */
  message?: string;
}

export const NoDataError = ({ message }: NoDataErrorProps = {}) => {
  const t_ec = useTranslations('ERROR_CODES');

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-destructive flex flex-col items-center gap-2">
        <CloudXIcon size={36} weight="light" />
        <div className="text-destructive text-[15px]">{message ?? t_ec('FETCH_DATA')}</div>
      </div>
    </div>
  );
};

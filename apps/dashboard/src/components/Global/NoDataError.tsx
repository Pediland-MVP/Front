import { CloudXIcon } from '@phosphor-icons/react/dist/ssr';
import { useTranslations } from 'next-intl';

export const NoDataError = () => {
  const t_ec = useTranslations('ERROR_CODES');

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-destructive flex flex-col items-center gap-2">
        <CloudXIcon size={36} weight="light" />
        <div className="text-destructive text-[15px]">{t_ec('FETCH_DATA')}</div>
      </div>
    </div>
  );
};

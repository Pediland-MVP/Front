// src/components/fetch-error.tsx

import { CloudSlashIcon } from '@phosphor-icons/react/dist/ssr/CloudSlash';
import { useTranslations } from 'next-intl';

export const FetchError = () => {
  const t = useTranslations('FetchError');

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="flex flex-col items-center gap-3 text-red-600">
        <CloudSlashIcon size={28} weight="duotone" /> {t('connectionError')}
        ...
      </p>
    </div>
  );
};

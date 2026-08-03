'use client';

import { useTranslations } from 'next-intl';
import { AndroidLogoIcon } from '@phosphor-icons/react/dist/ssr/AndroidLogo';
import { AppleLogoIcon } from '@phosphor-icons/react/dist/ssr/AppleLogo';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { ExportIcon } from '@phosphor-icons/react/dist/ssr/Export';
import { PlusSquareIcon } from '@phosphor-icons/react/dist/ssr/PlusSquare';
import Link from 'next/link';
import { Button, Card, CardContent } from '@/components/ui';
import { useDeviceOS } from '@/hooks/useDeviceOS';

const CAFEBAZAAR_URL = 'https://cafebazaar.ir/app/app.befroosh';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=app.befrooshm&pli=1';

export default function InstallPage() {
  const t = useTranslations('Install');
  const os = useDeviceOS();

  const showAndroid = os === 'android' || os === 'other';
  const showIos = os === 'ios' || os === 'other';

  return (
    <div className="_install-page flex h-full flex-col overflow-y-auto bg-white px-6 pt-7 md:p-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
          <p className="text-sm text-gray-500">{t('description')}</p>
        </div>

        {showAndroid && (
          <Card className="border-0 shadow-sm" data-testid="install-android-card">
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="flex items-center gap-2 text-gray-800">
                <AndroidLogoIcon size={24} weight="duotone" className="text-green-600" />
                <span className="font-semibold">{t('android_title')}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  asChild
                  variant="outline"
                  className="h-14 w-full gap-2 rounded-xl text-base font-medium"
                >
                  <Link href={CAFEBAZAAR_URL} target="_blank" rel="noopener noreferrer">
                    {t('android_cafebazaar')}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-14 w-full gap-2 rounded-xl text-base font-medium"
                >
                  <Link href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer">
                    {t('android_googleplay')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showIos && (
          <Card className="border-0 shadow-sm" data-testid="install-ios-card">
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="flex items-center gap-2 text-gray-800">
                <AppleLogoIcon size={24} weight="duotone" className="text-gray-700" />
                <span className="font-semibold">{t('ios_title')}</span>
              </div>
              <ol className="flex flex-col gap-3">
                <li className="flex items-center gap-3 text-sm text-gray-700">
                  <ExportIcon size={20} className="shrink-0 text-blue-500" />
                  {t('ios_step1')}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700">
                  <PlusSquareIcon size={20} className="shrink-0 text-blue-500" />
                  {t('ios_step2')}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircleIcon size={20} className="shrink-0 text-green-600" />
                  {t('ios_step3')}
                </li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

'use client';

import { CardContent } from '@/components/ui/card';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '../ui';
import { CardSimple } from '../ui-custom/CardSimple';

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
const INSTAGRAM_CLIENT_ID = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;

export const InstagramInvalid = () => {
  const router = useRouter();
  const t = useTranslations('Console');

  return (
    <CardSimple className="border-red-200 bg-red-50">
      <CardContent className="text-destructive flex items-center gap-2 px-3 py-3.5 text-sm">
        <div>
          <WarningCircleIcon className="" weight="duotone" size={24} />
        </div>
        <div>
          اعتبار نشست امنیتی اینستاگرام شما به پایان رسیده است. برای تمدید آن لازم است تا دوباره
          اکانت اینستاگرام خود را متصل نمایید.
        </div>

        <div>
          <Button
            className="bg-destructive/90 hover:bg-destructive h-9 text-[13px] text-white"
            onClick={() =>
              router.push(
                `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${API_URL}/instagram/redirectToFrontend&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments`,
              )
            }
          >
            ورود مجدد
          </Button>
        </div>
      </CardContent>
    </CardSimple>
  );
};

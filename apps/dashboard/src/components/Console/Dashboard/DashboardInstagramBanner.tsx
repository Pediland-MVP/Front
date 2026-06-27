import Link from 'next/link';

import { CardContent } from '@/components/ui';
import { CardSimple } from '@/components/ui-custom/CardSimple';
import { InstagramLogoIcon } from '@phosphor-icons/react/dist/ssr';

export const DashboardInstagramBanner = () => {
  return (
    <Link href={'https://www.instagram.com/befroosh.app'} target="_blank" rel="noopener noreferrer">
      <CardSimple className="border-purple-200/80 bg-linear-to-bl from-purple-100 to-purple-50/70">
        <CardContent className="flex items-center gap-3.5 p-3.5 md:gap-6 md:p-6">
          <div>
            <div className="text-[13px] leading-relaxed font-medium text-purple-600 md:text-sm">
              نکات طلائی رشد فروش و آموزش دایرکت هوشمند، همه در صفحه اینستاگرام بـفـروش منتشر می‌شن.
              دنبال کن تا هیچ آپدیتی رو از دست ندی!
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <InstagramLogoIcon
              weight="duotone"
              className="h-8 w-8 text-purple-500 md:h-10 md:w-10"
            />
            <span className="text-[13px] font-semibold text-purple-600 md:text-sm">فـالـو</span>
          </div>
        </CardContent>
      </CardSimple>
    </Link>
  );
};

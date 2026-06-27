'use client';

import { CardContent } from '@/components/ui';
import { CardSimple } from '@/components/ui-custom/CardSimple';
import { TelegramLogoIcon } from '@phosphor-icons/react/dist/ssr';

interface TelegramOtpAlertProps {
  phone?: string;
}

export const TelegramOtpAlert = ({ phone }: TelegramOtpAlertProps) => {
  const botUrl = phone
    ? `https://t.me/befrooshappbot?start=${encodeURIComponent(phone)}`
    : 'https://t.me/befrooshappbot';

  return (
    <CardSimple className="border-blue-200/80 bg-linear-to-bl from-blue-100 to-blue-50/70">
      <CardContent className="flex items-start gap-3 p-3.5">
        <TelegramLogoIcon weight="duotone" className="mt-0.5 h-6 w-6 shrink-0 text-blue-500" />
        <div className="flex flex-col gap-2 text-right">
          <p className="text-[12.5px] leading-relaxed text-blue-700">
            برای دریافت کد تأیید از طریق تلگرام، ربات ما را شروع کنید و شماره خود را از طریق دکمه
            «ارسال شماره موبایل» به اشتراک بگذارید. از آن پس، کدها در تلگرام هم ارسال می‌شوند.
          </p>
          <a
            href={botUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-500 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-blue-600"
          >
            <TelegramLogoIcon weight="fill" className="h-3.5 w-3.5" />
            شروع ربات در تلگرام
          </a>
        </div>
      </CardContent>
    </CardSimple>
  );
};

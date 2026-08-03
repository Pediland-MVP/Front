'use client';

import { TelegramLogoIcon } from '@phosphor-icons/react/dist/ssr/TelegramLogo';

interface TelegramOtpInlineLinkProps {
  phone?: string;
}

export const TelegramOtpInlineLink = ({ phone }: TelegramOtpInlineLinkProps) => {
  const botUrl = phone
    ? `https://t.me/befrooshappbot?start=${encodeURIComponent(phone)}`
    : 'https://t.me/befrooshappbot';

  return (
    <div className="text-muted-foreground flex items-center justify-center gap-1.5 text-[13px]">
      <span>کد دریافت نشد؟</span>
      <a
        href={botUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 font-medium text-blue-500 hover:text-blue-600"
      >
        <TelegramLogoIcon weight="duotone" className="h-4 w-4" />
        دریافت کد از تلگرام
      </a>
    </div>
  );
};

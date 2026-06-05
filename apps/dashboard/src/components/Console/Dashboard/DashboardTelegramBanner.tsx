import { CardContent } from "@/components/ui";
import { CardSimple } from "@/components/ui-custom/CardSimple";
import { TelegramLogoIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export const DashboardTelegramBanner = () => {
  return (
    <Link
      href={"https://t.me/befroosh_app"}
      target="_blank"
      rel="noopener noreferrer"
    >
      <CardSimple className="border-blue-200/80 bg-linear-to-bl from-blue-100 to-blue-50/70">
        <CardContent className="flex items-center gap-3.5 p-3.5 md:gap-6 md:p-6">
          <div>
            <div className="text-[13px] leading-relaxed font-medium text-blue-600 md:text-sm">
              برای اطلاع سریع از آخرین تغییرات، بروزرسانی‌ها و وضعیت لحظه‌ای
              سرویس دایرکت هوشمند بـفـروش، بهتره که عضو کانال تلگرام‌مون بشی.
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <TelegramLogoIcon
              weight="duotone"
              className="h-8 w-8 text-blue-500 md:h-10 md:w-10"
            />
            <span className="text-[13px] font-semibold text-blue-600 md:text-sm">
              عضویت
            </span>
          </div>
        </CardContent>
      </CardSimple>
    </Link>
  );
};

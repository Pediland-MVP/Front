"use client";

import { useTranslations } from "next-intl";
import {
  TelegramLogoIcon,
  WhatsappLogoIcon,
  PhoneCallIcon,
  EnvelopeIcon,
  InstagramLogoIcon,
  GraduationCap,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, Card, CardContent } from "@/components/ui";
import { usePathname } from "next/navigation";

type ContactMethod = {
  id: string;
  icon: any;
  labelKey: string;
  value?: string;
  href: string;
  colorClass: string;
  bgClass: string;
  description?: string;
  description2?: string;
};

export default function SupportPage() {
  const t = useTranslations("Support");

  const pathname = usePathname();

  const contactMethods: ContactMethod[] = [
    {
      id: "whatsapp",
      icon: WhatsappLogoIcon,
      labelKey: "whatsapp",
      description: "whatsapp_des",
      description2: "whatsapp_des2",
      href: "https://wa.me/09360226688",
      colorClass: "text-green-600",
      bgClass: "bg-green-50 hover:bg-green-100",
    },
    {
      id: "phone",
      icon: PhoneCallIcon,
      labelKey: "phone",
      description: "phone_des",
      value: "021-2842 3842", // Replace with actual phone
      href: "tel:+982128423842",
      colorClass: "text-orange-500",
      bgClass: "bg-orange-50 hover:bg-orange-100",
    },
    {
      id: "instagram",
      icon: InstagramLogoIcon,
      labelKey: "instagram",
      value: "@befroosh.app", // Replace with actual email
      href: "https://instagram.com/befroosh.app",
      colorClass: "text-purple-500",
      bgClass: "bg-purple-50 hover:bg-purple-100",
    },
    {
      id: "telegram_channel",
      icon: TelegramLogoIcon,
      labelKey: "telegram_channel",
      value: "@befroosh_support", // Replace with actual channel
      href: "https://t.me/befroosh_app",
      colorClass: "text-blue-500",
      bgClass: "bg-blue-50 hover:bg-blue-100",
    },
  ];

  return (
    <div className="_support-page flex h-full flex-col overflow-y-auto bg-white px-6 pt-7 md:p-8">
      {pathname === "/support" && (
        <div className="mb-4 flex w-full justify-end md:mb-8">
          <Button
            variant="ghost"
            asChild
            className="gap-2 text-gray-500 hover:text-gray-900"
          >
            <Link href="/">{t("enter_panel")}</Link>
          </Button>
        </div>
      )}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>
        </div>

        <div className="mt-1">
          <Button
            asChild
            size="lg"
            className="h-24 w-full cursor-pointer gap-3 rounded-xl bg-[#e6deff] text-purple-500 border-[1px]  border-[#845afd] text-lg shadow-lg shadow-purple-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-purple-300 hover:shadow-purple-300"
          >
            <Link href="/learn" target="_blank" className="flex flex-col">
              <p className="text-xs">{t("learn_center1")}<br/>{t("learn_center2")}</p>
              <p className="text-xs items-start justify-start">رفتن به بخش آموزش »</p>
            </Link>
          </Button>
        </div>

        <div className="flex justify-center items-center">
          <p className="text-sm text-gray-500">{t("description")}</p>
        </div>

        {/* Big Telegram Support Button */}
        <div className="mt-1">
          <Button
            asChild
            size="lg"
            className="h-16 w-full cursor-pointer gap-3 rounded-xl bg-blue-500 text-lg text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-blue-300"
          >
            <Link href="https://t.me/befroosh_support" target="_blank">
              <TelegramLogoIcon size={50} weight="fill" />
              <span>{t("telegram_main_button")}</span>
            </Link>
          </Button>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {contactMethods.map((method) => (
            <Link
              href={method.href}
              key={method.id}
              target="_blank"
              className="group block h-full"
            >
              <Card
                className={cn(
                  "h-24 border-0 shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md",
                  method.bgClass,
                )}
              >
                <CardContent className="flex h-full items-center gap-4 p-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm",
                      method.colorClass,
                    )}
                  >
                    <method.icon size={24} weight="duotone" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-gray-500">
                      {t(method.labelKey)}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      {method.description && t(method.description)}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      {method.description2 && t(method.description2)}
                    </span>
                    {method.value && (
                      <span
                        className="truncate text-right text-base font-semibold text-gray-800"
                        dir="ltr"
                      >
                        {method.value}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

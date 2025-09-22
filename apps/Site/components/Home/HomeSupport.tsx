import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@befroosh/ui";
import { Headset } from "lucide-react";

export const HomeSupport = () => {
  const t = useTranslations("Components.Home.HomeSupport");

  return (
    <section className="_home-support relative py-14">
      <div className="container max-w-5xl px-5">
        <Image
          className="absolute top-0 left-1/2 size-22 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-indigo-500/80 shadow-lg"
          src="/images/contact-img.jpg"
          alt="Customer Support Agent Image"
          width={120}
          height={120}
        />
        <h2 className="mb-2 text-center text-2xl font-semibold">
          <span className="text-gradient">{t("title_1")}</span>
          <br />
          <span>{t("title_2")}</span>
        </h2>
        <p className="mx-auto mb-6 px-4 text-center text-sm text-gray-600 md:w-2/5">
          {t("description")}
        </p>

        <div className="flex justify-center">
          <Button className="w-full bg-indigo-600 md:w-auto" asChild>
            <Link href="https://t.me/befroosh_support" target="_blank">
              <Headset />
              {t("button")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

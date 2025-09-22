import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@befroosh/ui";

export const HomeHero = () => {
  const t = useTranslations("Components.Home.HomeHero");

  return (
    <section className="_home-hero pt-10 pb-12">
      <div className="container px-5 md:px-0">
        <div className="_wrapper flex items-center justify-center">
          <div className="_items-wrapper space-y-3">
            <div>
              <h1 className="flex items-center justify-center gap-1 text-[28px] leading-tight font-semibold">
                {t("assistant")}
                <span className="font-black">{t("smart")}</span>
                {t("instagram")}
              </h1>
              <h2 className="text-gradient text-center text-[26px] font-semibold">
                {t("subtitle")}
              </h2>
            </div>
            <p className="text-center text-[16px] leading-7">
              {t("description")}
            </p>
            <div className="mt-6 text-center">
              <Button asChild className="btn btn-primary w-full md:w-auto">
                <Link href="https://console.befroosh.app">{t("button")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

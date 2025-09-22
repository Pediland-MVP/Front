import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@befroosh/ui";
import { PlayIcon } from "@phosphor-icons/react/dist/ssr";

export const HomeIntroMovie = () => {
  const t = useTranslations("Components.Home.HomeIntroMovie");

  return (
    <section className="_home-intro-movie py-20">
      <div className="container max-w-5xl px-5">
        <div className="_wrapper mx-auto md:w-1/2">
          <h2 className="mb-2 text-center text-2xl font-semibold">
            <span className="text-gradient font-extrabold">
              {t("smart-direct")}
            </span>{" "}
            {t("and")}
            <br />
            {t("instagram-automation")}
          </h2>

          <div className="_frame relative mx-auto mb-4 flex items-center p-3 md:max-w-[335px]">
            <div className="_image relative z-10 rounded-xl border-2 border-white">
              <Image
                className="rounded-xl"
                src="/images/intro-video-thumbnail.jpg"
                alt="Intro movie of Befroosh App"
                width={360}
                height={480}
              />
              <div className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-black/30">
                <PlayIcon weight="fill" className="text-xl text-white/70" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 z-0 flex h-24 w-30 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-violet-600"></div>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-gray-700">
            {t("description")}
          </p>

          <Button className="w-full" asChild>
            <Link href="https://console.befroosh.app">{t("button")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

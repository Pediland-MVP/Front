import { useTranslations } from "next-intl";
import Image from "next/image";

import {
  FilmReelIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  TelegramLogoIcon,
  XLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Copyright } from "./Copyright";
import Link from "next/link";

export const SiteFooter = (): JSX.Element => {
  const t = useTranslations("SiteFooter");

  return (
    <footer className="_home-footer bg-slate-800/90">
      <div className="pt-7 pb-14">
        <div className="container max-w-6xl px-5">
          <div className="flex flex-col items-center gap-10 md:flex-row md:gap-12">
            <div className="_footer-note text-white md:basis-1/3">
              <h2 className="mb-1">{t("befroosh")}،</h2>
              <p className="text-justify text-[13px] leading-5 font-light">
                {t("note")}
              </p>
            </div>

            <div className="_socials w-full rounded-lg bg-slate-800 p-4 md:w-auto">
              <h3 className="mb-4 text-center text-sm text-white">
                {t("social_title")}:
              </h3>
              <div className="flex items-center justify-center gap-5 text-slate-400">
                <Link
                  href={"https://www.instagram.com/befroosh.app"}
                  target="_blank"
                >
                  <InstagramLogoIcon size={28} />
                </Link>
                <Link href={"https://www.aparat.com/befroosh"} target="_blank">
                  <FilmReelIcon size={28} />
                </Link>
                <Link
                  href={"https://www.linkedin.com/company/befroosh"}
                  target="_blank"
                >
                  <LinkedinLogoIcon size={28} />
                </Link>
                <Link href={"https://t.me/befroosh_app"} target="_blank">
                  <TelegramLogoIcon size={28} />
                </Link>
                <Link href={"https://x.com/befroosh"} target="_blank">
                  <XLogoIcon size={28} />
                </Link>
              </div>
            </div>

            {/* <DownloadApplication /> */}
          </div>

          <div className="mt-10 flex items-center justify-center gap-3">
            <div className="_enamad flex items-center justify-center">
              <Image
                className="rounded-lg"
                src="/images/enamad.png"
                alt="Enamad"
                width={100}
                height={100}
              />
            </div>
          </div>
        </div>
      </div>

      <Copyright />
    </footer>
  );
};

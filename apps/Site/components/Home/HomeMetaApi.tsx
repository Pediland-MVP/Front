import Image from "next/image";
import { useTranslations } from "next-intl";

export const HomeMetaApi = () => {
  const t = useTranslations("Components.Home.HomeMetaApi");
  return (
    <section className="_home-meta-api bg-gradient-to-b from-gray-700 to-gray-900 pt-10 pb-8">
      <div className="container max-w-5xl px-5">
        <div className="mx-auto flex flex-col items-center md:w-2/3">
          <div className="mx-auto mb-5 inline-flex items-center justify-center gap-4 rounded-xl bg-white/90 px-4 py-2.5">
            <Image
              src="/images/logo-threads.svg"
              alt="Threads Logo"
              className="h-8"
              width={32}
              height={32}
            />
            <Image
              src="/images/logo-instagram.svg"
              alt="Instagram Logo"
              className="h-8"
              width={32}
              height={32}
            />
            <Image
              src="/images/logo-meta.svg"
              alt="Meta Logo"
              width={130}
              height={26}
            />
          </div>

          <p className="text-center text-white">
            <span className="text-[16px] font-bold">
              {t("befroosh_meta_partner")}
            </span>{" "}
            <span className="text-sm font-light">
              ({t("instagram_holding")})
            </span>{" "}
            {t("description")}
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-center text-3xl font-light text-white">
            <span>Instagram API</span>
            <Image
              className="-mt-1.5 size-6"
              src="/images/icon-blue-tick.svg"
              alt="Instagram Blue Tick Logo"
              width={28}
              height={28}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

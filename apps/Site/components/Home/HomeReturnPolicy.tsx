import { useTranslations } from "next-intl";
import Image from "next/image";

export const HomeReturnPolicy = () => {
  const t = useTranslations("Components.Home.HomeReturnPolicy");

  return (
    <section className="_home-return-policy pb-10">
      <div className="container max-w-5xl px-5">
        <div className="mx-auto max-w-[340px] rounded-xl bg-gradient-to-br from-lime-600/90 to-lime-400/80 p-6 shadow-lg">
          <div className="flex items-center gap-5">
            <Image
              src="/images/icon-money-back-2.png"
              alt="Moneyback Icon"
              width={68}
              height={68}
            />
            <h2 className="text-xl font-bold text-white text-shadow-sm">
              {t("title")}
            </h2>
          </div>
          <p className="mt-4 text-sm leading-relaxed font-medium text-slate-800">
            {t("description")}
          </p>
        </div>
      </div>
    </section>
  );
};

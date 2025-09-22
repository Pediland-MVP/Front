import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button } from "@befroosh/ui";
import { customers } from "@/constants/customers";
import Image from "next/image";

export const HomeCustomers = () => {
  const t = useTranslations("Components.Home.HomeCustomers");

  return (
    <section className="_home-customers py-16">
      <div className="container max-w-5xl px-5">
        <div>
          <h2 className="mb-10 text-center text-2xl">
            {t("title_1")}
            <br />
            <span className="text-gradient font-bold">{t("title_2")}</span>
          </h2>

          <div className="mb-8 grid grid-cols-3 gap-x-4 gap-y-6 md:grid-cols-6">
            {customers.map((c, idx) => (
              <div className="flex flex-col items-center" key={idx}>
                <div className="relative mb-2 flex max-w-26 justify-center">
                  <Image
                    src={c.avatar}
                    alt={c.name}
                    width={74}
                    height={74}
                    className="rounded-full border border-violet-600"
                  />
                  <div className="absolute -bottom-1 -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-bl from-blue-400 to-violet-700 text-[11px] font-light text-white">
                    <span className="mt-1">{c.followers}</span>
                  </div>
                </div>
                <h3 className="text-[13px] font-semibold">{c.name}</h3>
                <h4 className="line-clamp-1 text-[11px] text-gray-600">
                  {c.title}
                </h4>
              </div>
            ))}
          </div>

          <p className="text-center text-[15px] font-medium text-violet-700">
            {t("description")}
          </p>

          <div className="mt-6 flex justify-center">
            <Button className="w-full md:w-auto" asChild>
              <Link href="https://console.befroosh.app">{t("button")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

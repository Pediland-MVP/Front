"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import React from "react";

import { Button } from "@befroosh/ui";
import {
  FlowerTulipIcon,
  PackageIcon,
  PlantIcon,
  SunIcon,
  TreeEvergreenIcon,
  type IconProps,
} from "@phosphor-icons/react";

type Props = {
  btnColors?: string[];
  iconColors?: string[];
};

const ICONS: Record<string, React.ComponentType<IconProps>> = {
  plant: PlantIcon,
  "flower-tulip": FlowerTulipIcon,
  "tree-evergreen": TreeEvergreenIcon,
  sun: SunIcon,
  package: PackageIcon,
};

export const HomePricing = ({
  btnColors = [
    "bg-violet-500",
    "bg-violet-600",
    "bg-violet-700",
    "bg-violet-800",
  ],
  iconColors = [
    "text-lime-500",
    "text-rose-400",
    "text-green-700",
    "text-amber-400",
  ],
}: Props) => {
  const pricingItems = [
    { icon: "plant", title: "کمتر از 25K", price: "198" },
    { icon: "flower-tulip", title: "25K تا 100K", price: "298" },
    { icon: "tree-evergreen", title: "100K تا 500K", price: "398" },
    { icon: "sun", title: "بیشتر از 500K", price: "498" },
  ];

  const t = useTranslations("Components.Home.HomePricing");

  return (
    <section
      className={`_home-pricing bg-gradient-to-t from-white to-gray-200/70 py-14`}
    >
      <div className="container max-w-5xl px-7">
        <h2 className="text-gradient mb-7 text-center text-2xl font-bold">
          {t("title")}
        </h2>

        <div className="flex flex-col gap-10 md:flex-row md:justify-between md:gap-4">
          {pricingItems.map((it, i) => {
            const btnColorClass = btnColors[i % btnColors.length];
            const iconColorClass = iconColors[i % iconColors.length];
            const Icon = ICONS[it.icon] ?? PackageIcon;

            return (
              <div
                key={`${it.title}-${i}`}
                className="_item flex-wrap rounded-xl border-2 bg-white px-6 pb-8 pt-10 md:px-5 md:pt-6"
              >
                <div className="flex items-center gap-x-6 md:flex-col md:gap-4">
                  <Icon
                    size={50}
                    weight="thin"
                    className={iconColorClass}
                    aria-hidden
                  />
                  <div className="space-y-1 text-center">
                    <h3 className="text-lg font-medium">
                      {t("page")} {it.title} {t("followers")}
                    </h3>
                    <p className="text-lg font-bold text-violet-600">
                      {it.price} {t("tomans")}
                    </p>
                  </div>
                </div>

                <div className="-mb-12 mt-6">
                  <Button
                    asChild
                    className={`btn ${btnColorClass} inline-flex w-full items-center justify-center`}
                  >
                    <Link href="https://console.befroosh.app">
                      {t("button")}
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

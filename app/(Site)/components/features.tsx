import {
  Coins,
  Cube,
  Database,
  FloppyDisk,
  Robot,
  Truck,
  UserSwitch,
} from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";

type Feature = {
  icon?: React.ComponentType<any>;
  title: string;
  text: string;
};

export default function Features() {
  const t = useTranslations("Home");

  const featuresList: Feature[] = [
    {
      icon: FloppyDisk,
      title: t("Features.title1"),
      text: t("Features.text1"),
    },
    {
      icon: Database,
      title: t("Features.title2"),
      text: t("Features.text2"),
    },
    {
      icon: Coins,
      title: t("Features.title3"),
      text: t("Features.text3"),
    },
    {
      icon: Truck,
      title: t("Features.title4"),
      text: t("Features.text4"),
    },
    {
      icon: Robot,
      title: t("Features.title5"),
      text: t("Features.text5"),
    },
    {
      icon: UserSwitch,
      title: t("Features.title6"),
      text: t("Features.text6"),
    },
  ];

  return (
    <div className="_features">
      <div className="container max-w-6xl px-3 sm:px-4 xl:px-0 mx-auto">
        <div className="_wrapper border-b border-dashed py-14 sm:py-20 md:w-5/6 sm:mx-auto">
          <h2 className="text-secondary text-center text-3xl font-bold mb-10">
            امکانات:
          </h2>
          <div className="_cards grid sm:grid-cols-2 gap-12 md:gap-8 xl:gap-10">
            {featuresList.map((feature, index) => (
              <div
                key={index}
                className="_card flex flex-col xl:flex-row items-center xl:items-start gap-4 md:gap-6 xl:gap-4"
              >
                {feature.icon && (
                  <div className="_icon">
                    <feature.icon
                      weight="duotone"
                      size={54}
                      className="text-primary"
                    />
                  </div>
                )}
                <div className="_text text-center xl:text-right">
                  <h3 className="text-primary text-xl font-bold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 font-medium text-lg sm:text-[17px]">
                    {feature.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Lightbulb } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";

export default function SecTwo() {
  const t = useTranslations("Home");

  return (
    <div className="_secTwo py-16">
      <div className="container max-w-6xl px-3 sm:px-0 mx-auto">
        <div className="_wrapper flex items-center justify-center">
          <h2 className="flex items-center justify-center w-5/6 sm:w-full gap-3 sm:gap-2 text-xl md:text-2xl font-medium tracking-tight text-primary">
            <span>
              <Lightbulb
                weight="duotone"
                className="w-12 h-12 sm:w-10 sm:h-10 text-yellow-500"
              />
            </span>
            <span>{t("Section2.title")}</span>
          </h2>
        </div>
      </div>
    </div>
  );
}

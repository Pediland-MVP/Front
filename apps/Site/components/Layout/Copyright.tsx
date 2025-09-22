import Link from "next/link";
import { useTranslations } from "next-intl";

export const Copyright = () => {
  const t = useTranslations("Copyright");

  return (
    <div className="_copyright bg-slate-800 py-4">
      <div className="container px-5 md:px-0">
        <p className="text-center text-xs font-light text-gray-200">
          © {t("text_1")}{" "}
          <Link
            className="text-white"
            href="https://befroosh.app"
            target="_blank"
          >
            {t("befroosh")}
          </Link>{" "}
          {t("text_2")}
        </p>
      </div>
    </div>
  );
};

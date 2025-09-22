import Image from "next/image";
import { useTranslations } from "next-intl";
import { CloudArrowDownIcon } from "@phosphor-icons/react/dist/ssr";

export const DownloadApplication = () => {
  const t = useTranslations("DownloadApplication");

  return (
    <div className="_download-app flex-1 rounded-lg bg-slate-800 p-4">
      <h3 className="mb-4 text-center text-[15px] font-semibold text-white">
        {t("download_title")}
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 rounded-sm border border-dashed border-slate-500 bg-slate-700 p-2 font-medium text-white">
          <Image
            src="/images/logo-bazaar.png"
            alt="App"
            width={24}
            height={24}
          />
          <span className="text-[13px]">{t("download_from")}</span>
          <Image
            src="/images/logo-bazaar-typo.png"
            alt="App"
            width={37}
            height={24}
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-sm border border-dashed border-slate-500 bg-slate-700 p-2 font-medium text-white">
          <Image
            src="/images/logo-myket.png"
            alt="App"
            width={24}
            height={24}
          />
          <span className="text-[13px]">{t("download_from")}</span>
          <Image
            src="/images/logo-myket-typo.png"
            alt="App"
            width={40}
            height={22}
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-sm border border-dashed border-slate-500 bg-slate-700 p-2 font-medium text-white">
          <Image
            src="/images/logo-apple.png"
            alt="App"
            width={24}
            height={24}
          />
          <span className="text-[13px]">{t("web_application")}</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-sm border border-dashed border-slate-500 bg-slate-700 p-2 font-medium text-white">
          <CloudArrowDownIcon
            weight="duotone"
            className="text-violet-400"
            size={24}
          />
          <span className="text-[13px]">{t("download_direct")}</span>
        </div>
      </div>
    </div>
  );
};

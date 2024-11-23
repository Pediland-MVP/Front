import { useTranslations } from "next-intl";

export default function ExplainMore2() {
  const t = useTranslations('Lorem')
  return (
    <div className="max-w-[40rem] m-auto w-full flex  md:mb-24 mb-16">
      <h2 className=" text-2xl text-center leading-120 font-medium md:text-2xl lg:leading-[3rem] lg:text-[38px] px-16 md:px-0">
        {t('s')}
      </h2>
    </div>
  );
}

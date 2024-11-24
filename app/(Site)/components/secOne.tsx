import React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import image01 from "@/public/images/site/image-01.webp";
import image02 from "@/public/images/site/image-02.webp";
export default function SecOne() {
  const t = useTranslations("Home");

  return (
    <div className="_secOne max-w-1/2 bg-fuchsia-50/90 py-10">
      <div className="container max-w-6xl px-3 sm:px-4 xl:px-0 mx-auto">
        <div className="_wrapper flex flex-col-reverse sm:flex-row items-center justify-between gap-5 md:gap-10 px-0 sm:px-4 md:px-0">
          <Image
            src={image02}
            alt="a man is laughing"
            width={0}
            height={0}
            className="hidden md:block xl:w-[183px] xl:h-[202px] w-[161px] h-[178px]"
          />
          <h2 className="text-center sm:text-right md:text-center md:leading-[2.5rem] xl:leading-[3rem] max-w-[250px] sm:max-w-full">
            <span className="inline-block text-primary font-semibold text-2xl md:text-3xl xl:text-4xl leading-normal">
              {t("Section1.title")}
            </span>
            <br />
            <span className="inline-block text-gray-500 text-[20px] xl:text-[22px] font-medium leading-normal">
              {t("Section1.subTitle")}
            </span>
          </h2>
          <Image
            src={image01}
            alt="a man is laughing"
            width={180}
            height={192}
            className="w-[146px] h-[156px] md:w-[158px] md:h-[169px] xl:w-[180px] xl:h-[192px]"
          />
        </div>
      </div>
    </div>
  );
}

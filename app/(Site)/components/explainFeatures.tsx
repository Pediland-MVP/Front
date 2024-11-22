"use client";
import React from "react";
import pipline from "@/public/kommo-profile.png";
import Image, { StaticImageData } from "next/image";
import { ArrowArcRight, ArrowLeft } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
interface ExplainFeaturesProps {
    bg: string;
    picCoverBg: string;
    srcPic: StaticImageData; // Use `StaticImageData` if you are using a static import for the image
    title: string;
    text: string;
    flex:string,
    picCoverSize:string
  }
  
  
  const ExplainFeatures: React.FC<ExplainFeaturesProps> = ({flex, bg,picCoverSize, picCoverBg, srcPic, title, text }) => {
    const t = useTranslations('General')
  return (
    <div className={`flex justify-center items-center mb-4 md:mb-6 md:px-16 px-4 text-blueKommo `}>
      <div className={`w-full max-w-[80rem] ${bg} rounded-2xl py-6 px-4 md:px-8 xl:px-12`}>
        <div className={`flex w-full  flex-col-reverse  ${flex} items-center lg:gap-8 `}>
          <div className="sm:w-1/2 w-full m-auto flex flex-col pt-4 gap-4 md:pt-0  xl:w-1/2 l md:px-8">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-md ">{text}
            </p>
            <span className="flex gap-2 mt-4 items-center hover:text-purple-700 cursor-pointer font-semibold">
              {t('more')}
              <ArrowLeft
                size={18}
                color="#100534"
                className="hover:text-purple-700"
              />
            </span>
          </div>
          <div className="relative w-full sm:w-1/2 xl:pb-[24%]  md:pb-[33%] pb-[40%] ">
            <Image
              src={srcPic}
              objectFit="cover"
                     // objectFit="cover"
            objectPosition="center"
              layout="fill"
              alt="Description"
              className={`rounded-[1rem] w-auto   ${picCoverSize} ${picCoverBg}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
export default ExplainFeatures;

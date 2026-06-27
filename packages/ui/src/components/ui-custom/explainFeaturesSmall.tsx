'use client';
import React from 'react';
import pipline from '@/public/kommo-profile.png';
import Image, { StaticImageData } from 'next/image';
import { ArrowArcRight, ArrowLeft } from '@phosphor-icons/react';
interface ExplainFeaturesProps {
  bg: string;
  picCoverBg: string;
  srcPic: StaticImageData; // Use `StaticImageData` if you are using a static import for the image
  title: string;
  text: string;
  flex: string;
  picCoverSize: string;
}

const ExplainFeatures: React.FC<ExplainFeaturesProps> = ({
  flex,
  bg,
  picCoverSize,
  picCoverBg,
  srcPic,
  title,
  text,
}) => {
  return (
    <div className={`text-blueKommo mb-4 flex items-center justify-center md:mb-6`}>
      <div className={`w-full max-w-[35rem] ${bg} rounded-2xl px-4 py-6`}>
        <div className={`flex w-full flex-col-reverse ${flex} items-center`}>
          <div className="l m-auto flex w-full flex-col gap-4 pt-4 sm:w-1/2 md:px-8 md:pt-0 xl:w-1/2">
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="text-sm">{text}</p>
            <span className="mt-4 flex cursor-pointer items-center gap-2 font-semibold hover:text-purple-700">
              بیشتر
              <ArrowLeft size={18} color="#100534" className="hover:text-purple-700" />
            </span>
          </div>
          <div className="relative w-full sm:w-1/2 xl:pb-[34%]">
            <Image
              src={srcPic}
              objectFit="cover"
              // objectFit="cover"
              objectPosition="center"
              layout="fill"
              alt="Description"
              className={`w-auto rounded-[1rem]`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default ExplainFeatures;

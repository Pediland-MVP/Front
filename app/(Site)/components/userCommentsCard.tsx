"use client";
import React from "react";
import Image, { StaticImageData } from "next/image";
import { ArrowLeft } from "@phosphor-icons/react";

interface UserCommentsCardProps {
  bg: string;
  picCoverBg: string;
  srcPic: StaticImageData | string;
  title: string;
  text: string;
  flex: string;
  picCoverSize: string;
}

const UserCommentsCard: React.FC<UserCommentsCardProps> = ({
  flex,
  bg,
  picCoverSize,
  picCoverBg,
  srcPic,
  title,
  text,
}) => {
  return (
    <div className={`flex text-blueKommo max-w-[60rem]`}>
      <div className={`w-full ${bg} rounded-2xl py-4 px-4`}>
        <div
          className={`flex w-full flex-col-reverse ${flex} items-center lg:gap-8`}
        >
          <div dir="rtl" className="w-full flex flex-col pt-4 gap-4 md:pt-0 xl:w-2/3 md:px-8">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-md">{text}</p>
            <span className="flex gap-2 mt-4 items-center hover:text-purple-700 cursor-pointer font-semibold">
              بیشتر
              <ArrowLeft
                size={18}
                color="#100534"
                className="hover:text-purple-700"
              />
            </span>
          </div>
          <div className="relative w-full xl:w-1/3 xl:pb-[40%]  md:pb-[40%] lg:pb-[40%] pb-[80%]">
            <Image
              src={srcPic}
              objectFit="cover"
              objectPosition="center"
              layout="fill"
              alt="Description"
              className={`rounded-[1rem] ${picCoverSize} ${picCoverBg}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCommentsCard;

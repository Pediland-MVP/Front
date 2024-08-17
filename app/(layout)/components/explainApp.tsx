import Image, { StaticImageData } from "next/image";
import React from "react";
import screenShot1 from "../../../public/profile-ui-kommo.png";

interface ExplainProps {
  srcPic: string | StaticImageData;
  text: string;
  title: string;
  picCoverSize?: string;
  picCoverBg?: string;
  flex?: string;
}

export default function ExplainApp({
  srcPic,
  text,
  title,
  picCoverSize = "cover",
  picCoverBg = "bg-yellow-200",
  flex = "flex-col xl:flex-row",
}: ExplainProps) {
  return (
    <div className="max-w-[86rem] w-full sm:mb-[6rem] mb-14 mx-auto md:px-[3rem]">
      <div
        className={`flex ${flex} w-full items-center lg:items-start px-4 gap-8`}
      >
        <div
          className={`relative w-full xl:w-1/2 h-0 xl:pb-[35%] md:pb-[45%] pb-[70%] px-[%] rounded-[2rem]  pt-[4.5rem] ${picCoverBg}`}
        >
          <Image
            src={srcPic}
            alt="Story Image"
            layout="fill"
            className={`rounded-[1rem] w-auto ${picCoverSize}`}
            objectFit={picCoverSize}
            objectPosition="center"
          />
        </div>
        <div className="w-full m-auto flex flex-col gap-4 xl:w-1/2 l md:px-8">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-md mb-4 text-gray-700">{text}</p>
        </div>
      </div>
    </div>
  );
}

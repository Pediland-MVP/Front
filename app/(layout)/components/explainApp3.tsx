import Image from "next/image";
import React from "react";
import screenShot1 from "../../../public/profile-ui-kommo.png";
export default function ExplainApp3() {
  return (
    <div className="max-w-[86rem] w-full md:mb-24 mb-12 mx-auto md:px-[3rem]">
      <div className="flex flex-col w-full xl:flex-row items-center lg:items-start px-4 gap-8">
        <div className="relative w-full xl:w-1/2 h-0 xl:pb-[35%] md:pb-[45%] pb-[70%] px-[%] rounded-[2rem] pl-[3.5rem] pt-[3.5rem]  bg-yellow-200">
          {" "}
          {/* For 600x400 aspect ratio */}
          <Image
            src={screenShot1}
            alt="Story Image"
            layout="fill"
            className="rounded-[1rem] xl:pr-[3.5rem] xl:pb-[3.5rem] md:pr-[2rem] md:pb-[2rem] pb-[1rem] pr-[1rem] bg-blue-200 "
            // objectFit="cover"
            objectPosition="center"
          />
        </div>
        <div className="w-full m-auto flex flex-col gap-4 xl:w-1/2 l md:px-8">
          <h1 className="text-2xl font-semibold">
            لورم ایپسوم متن ساختگی با<br className="hidden xl:block"/> تولید سادگی نامفهوم از صنعت چاپ
          </h1>
          <p className="text-md mb-4 text-gray-700">
            لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با
            استفاده از طراحان گرافیک است چاپگرها و متون بلکه روزنامه و مجله در
            ستون و سطرآنچنان که لازم است
          </p>
          {/* <span className="flex gap-4"><p>ادامه</p> <arr</span> */}
        </div>
      </div>
    </div>
  );
}

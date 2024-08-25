"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState } from "react";

export default function HeroSectionFeatures() {
  return (
    <div className="flex sm:mt-20 mt-10 w-full max-w-[70rem] m-auto text-center justify-center xl:px-20 md:px-6 px-4 ">
      <div className="flex my-24 flex-col sm:gap-4 md:gap-2 items-center justify-start md:justify-center">
        <div className="relative w-full hidden md:flex"></div>
        <p className="text-xl font-semibold text-blueKommo mb-4">
          لورم اپیزوم اینجا
        </p>
        <h1 className="text-blueKommo xl:text-4xl md:text-5xl text-4xl font-semibold leading-[2.9rem] xl:leading-[3.5rem] md:leading-[3.5rem]">
          لورم ایپسوم متن ساختگی با <br className="hidden sm:block" />
          چاپ و با استفاده از <br className="hidden sm:block" />
          گرافیک است صنعت نامفهوم از
        </h1>
        <h2 className="text-md font-lighyt text-blueKommo mt-4">
          لورم ایپسوم متن ساختگی با 
          چاپ و با استفاده از <br className="hidden sm:block" />
          گرافیک است صنعت نامفهوم از
        </h2>
        <div className="relative">
          <Button className="md:h-[4rem] h-[3rem] bg-blueKommo mt-8" size="lg">
            شروع رایگان برای 14 روز
          </Button>
        </div>
      </div>
    </div>
  );
}

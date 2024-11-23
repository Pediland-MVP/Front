"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { useEffect, useState } from "react";

export default function HeroSectionFeatures() {
  const t = useTranslations('Home.BigSection')
  return (
    <div className="flex sm:mt-20 mt-10 w-full max-w-[70rem] m-auto text-center justify-center xl:px-20 md:px-6 px-4 ">
      <div className="flex my-24 flex-col sm:gap-4 md:gap-2 items-center justify-start md:justify-center">
        <div className="relative w-full hidden md:flex"></div>
        <p className="text-xl font-semibold text-blueKommo mb-4">
          {t('xs')}
        </p>
        <h1 className="text-blueKommo xl:text-4xl md:text-5xl text-4xl font-semibold leading-[2.9rem] xl:leading-[3.5rem] md:leading-[3.5rem]">
          {t('xs')} <br className="hidden sm:block" />
          {t('xs')} <br className="hidden sm:block" />
          {t('xs')}
        </h1>
        <h2 className="text-md font-lighyt text-blueKommo mt-4">
          {t('xs')}
          {t('xs')} <br className="hidden sm:block" />
          {t('xs')}
        </h2>
        <div className="relative">
          <Button className="md:h-[4rem] h-[3rem] bg-blueKommo mt-8" size="lg">
            {t('trialButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}

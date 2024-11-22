"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const images = [
  "https://pcfcdn.kommo.com/images/main/circle-instagram.svg",
  "https://pcfcdn.kommo.com/images/main/circle-telegram.svg",
  "https://pcfcdn.kommo.com/images/main/circle-whatsapp.svg",
  "https://pcfcdn.kommo.com/images/main/circle-messenger.svg",
  "https://pcfcdn.kommo.com/images/main/circle-gmail.svg",
  "https://pcfcdn.kommo.com/images/main/circle-gmail.svg"
  // می‌توانید تصاویر بیشتری به اینجا اضافه کنید
];

export default function HeroSection() {
  const [currentImages, setCurrentImages] = useState([images[0], images[1], images[2], images[3]]);
  const [fades, setFades] = useState([false, false, false, false]);

  const updateImage = (index: number, duration: number) => {
    setFades(prevFades => {
      const newFades = [...prevFades];
      newFades[index] = true;
      return newFades;
    });

    setTimeout(() => {
      setCurrentImages(prevImages => {
        const newImages = [...prevImages];
        let availableImages = images.filter(img => !newImages.includes(img));

        if (availableImages.length === 0) {
          availableImages = images.filter(img => img !== newImages[index]);
        }

        newImages[index] = availableImages[Math.floor(Math.random() * availableImages.length)];
        return newImages;
      });

      setFades(prevFades => {
        const newFades = [...prevFades];
        newFades[index] = false;
        return newFades;
      });
    }, duration);
  };

  useEffect(() => {
    const intervals = [
      setInterval(() => updateImage(0, 1000), 7000),
      setInterval(() => updateImage(1, 1000), 9000),
      setInterval(() => updateImage(2, 1000), 15000),
      setInterval(() => updateImage(3, 1000), 19000),
    ];

    return () => intervals.forEach(clearInterval);
  }, []);

  const t = useTranslations('Home')

  return (
    <div className="flex my-24 h-auto md:h-[88vh]  w-full max-w-[70rem] m-auto text-center justify-center xl:px-20 md:px-6 px-4 ">
      <div className="flex flex-col sm:gap-4 md:gap-2 items-center justify-start md:justify-center">
        <div className="relative w-full hidden md:flex">
          <div className={`_pic absolute top-0 md:-top-12 xl:-top-24 xl:-left-[9rem] -left-[2rem] z-1 ${fades[1] ? "opacity-0 translate-y-[2rem]" : "opacity-100 translate-y-[0rem]"} transition-all duration-1000`}>
            <Image width={0} height={0} alt="logo" className="w-16 md:w-20 xl:w-32" src={currentImages[1]} />
          </div>
          <div className={`_pic absolute top-0 md:top-[2.5rem] xl:top-[3rem] xl:-left-[3.8rem] -left-[2rem] z-1 ${fades[2] ? "opacity-0 translate-y-[2rem]" : "opacity-100 translate-y-[0rem]"} transition-all duration-1000`}>
            <Image width={0} height={0} alt="logo" className="w-[2rem] md:w-[3rem] xl:w-[4rem]" src={currentImages[2]} />
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-500">{t('crm')}</p>
        <h1 className="text-blueKommo xl:text-6xl md:text-5xl text-4xl font-semibold leading-[2.9rem] xl:leading-[5rem] md:leading-[3.5rem]">
          {t('xs')} <br className="hidden sm:block" />
          {t('xs')} <br className="hidden sm:block" />
          {t('xs')}
        </h1>
        <div className="md:hidden flex gap-4">
          <div className={`flex transition-all duration-1000 ${fades[2] ? "opacity-0" : "opacity-100"}`}>
            <Image width={40} height={40} alt="logo" src={currentImages[2]} />
          </div>
          <div className={`flex transition-all duration-1000 ${fades[3] ? "opacity-0" : "opacity-100"}`}>
            <Image width={40} height={40} alt="logo" src={currentImages[3]} />
          </div>
        </div>
        <div className="relative">
          <Button className="md:h-[4rem] h-[3rem] bg-blueKommo mt-4" size="lg">{t('trialButton')}</Button>
          <div className={`hidden md:block _pic absolute xl:-left-[] md:-top-[1rem] md:-right-[18rem] xl:-right-[27rem] ${fades[0] ? "opacity-0 translate-y-[3rem]" : "opacity-100 translate-y-[0rem]"} transition-all duration-1000`}>
            <Image width={0} height={0} className="w-[4rem] md:w-[5rem] xl:w-[8rem]" alt="logo" src={currentImages[0]} />
          </div>
          <div className={`_pic hidden md:block absolute xl:-left-[] top-[9rem] right-[2rem] md:-top-[3rem] xl:-top-[4rem] md:-right-[21rem] xl:-right-[32rem] ${fades[3] ? "opacity-0 translate-y-[3rem]" : "opacity-100 translate-y-[0rem]"} transition-all duration-1000`}>
            <Image width={0} height={0} className="w-[4rem] md:w-[3rem] xl:w-[5rem]" alt="logo" src={currentImages[3]} />
          </div>
        </div>
      </div>
    </div>
  );
}

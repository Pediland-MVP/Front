"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { useEffect, useState } from "react";
// Just UI Imports Below
import { Button } from "@/components/theme/ui/button";
import Link from "next/link";

const images = [
  "https://pcfcdn.kommo.com/images/main/circle-instagram.svg",
  "https://pcfcdn.kommo.com/images/main/circle-telegram.svg",
  "https://pcfcdn.kommo.com/images/main/circle-whatsapp.svg",
  "https://pcfcdn.kommo.com/images/main/circle-messenger.svg",
  "https://pcfcdn.kommo.com/images/main/circle-gmail.svg",
  "https://pcfcdn.kommo.com/images/main/circle-gmail.svg",
  // می‌توانید تصاویر بیشتری به اینجا اضافه کنید
];

export default function HeroSection() {
  const [currentImages, setCurrentImages] = useState([
    images[0],
    images[1],
    images[2],
    images[3],
  ]);
  const [fades, setFades] = useState([false, false, false, false]);

  const updateImage = (index: number, duration: number) => {
    setFades((prevFades) => {
      const newFades = [...prevFades];
      newFades[index] = true;
      return newFades;
    });

    setTimeout(() => {
      setCurrentImages((prevImages) => {
        const newImages = [...prevImages];
        let availableImages = images.filter((img) => !newImages.includes(img));

        if (availableImages.length === 0) {
          availableImages = images.filter((img) => img !== newImages[index]);
        }

        newImages[index] =
          availableImages[Math.floor(Math.random() * availableImages.length)];
        return newImages;
      });

      setFades((prevFades) => {
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

  const t = useTranslations("Home");

  return (
    <div className="_heroSection">
      <div className="container max-w-6xl px-3 sm:px-4 xl:px-0">
        <div className="_wrapper py-20 md:py-24 lg:py-32 relative">
          <div className="_title flex flex-col gap-8 items-center justify-start md:justify-center">
            <h1 className="text-secondary text-4xl lg:text-5xl xl:text-[3.25rem] font-bold leading-[3rem] md:leading-[3.25rem] lg:leading-[4rem] xl:leading-[5rem] sm:max-w-[30rem] lg:max-w-[40rem] xl:max-w-[50rem] text-center">
              {t("heroSectionTitle")}
            </h1>

            <Button className="bg-primary" size="lg" asChild>
              <Link href="/console">{t("trialButton")}</Link>
            </Button>
          </div>

          <div className="_iconLeft hidden md:flex">
            <div
              className={`_pic1 absolute top-16 xl:top-[70px] left-0 xl:-left-[4rem] z-1 ${fades[1] ? "opacity-0 translate-y-[2rem]" : "opacity-100 translate-y-[0rem]"} transition-all duration-1000`}
            >
              <Image
                width={0}
                height={0}
                alt="logo"
                className="w-[5rem] lg:w-[6.5rem] xl:w-[8rem]"
                src={currentImages[1]}
              />
            </div>
            <div
              className={`_pic2 absolute top-40 lg:top-48 xl:top-52 left-14 lg:left-20 xl:left-16 z-1 ${fades[2] ? "opacity-0 translate-y-[2rem]" : "opacity-100 translate-y-[0rem]"} transition-all duration-1000`}
            >
              <Image
                width={0}
                height={0}
                alt="logo"
                className="w-[2.5rem] lg:w-[3.5rem] xl:w-[4.5rem]"
                src={currentImages[2]}
              />
            </div>
          </div>

          <div className="_iconRight hidden md:flex">
            <div
              className={`_pic3 hidden md:block absolute bottom-20 lg:bottom-24 xl:bottom-[70px] right-0 xl:-right-[4rem] ${fades[0] ? "opacity-0 translate-y-[3rem]" : "opacity-100 translate-y-[0rem]"} transition-all duration-1000`}
            >
              <Image
                width={0}
                height={0}
                className="w-[5rem] lg:w-[6.5rem] xl:w-[8rem]"
                alt="logo"
                src={currentImages[0]}
              />
            </div>

            <div
              className={`_pic4 hidden md:block absolute bottom-44 lg:bottom-56 lg:right-20 right-16 ${fades[3] ? "opacity-0 translate-y-[3rem]" : "opacity-100 translate-y-[0rem]"} transition-all duration-1000`}
            >
              <Image
                width={0}
                height={0}
                className="w-[2.5rem] lg:w-[3.5rem] xl:w-[4.5rem]"
                alt="logo"
                src={currentImages[3]}
              />
            </div>
          </div>

          <div className="_iconCenter md:hidden flex gap-5 absolute top-4 left-0 justify-center w-full">
            <div
              className={`_pic5flex transition-all duration-1000 ${fades[2] ? "opacity-0" : "opacity-100"}`}
            >
              <Image width={44} height={44} alt="logo" src={currentImages[2]} />
            </div>
            <div
              className={`_pic6 flex transition-all duration-1000 ${fades[3] ? "opacity-0" : "opacity-100"}`}
            >
              <Image width={44} height={44} alt="logo" src={currentImages[3]} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

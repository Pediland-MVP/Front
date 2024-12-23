"use client";

import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import poplineImage from "@/public/pipeline-image-kommo.png";
import { useTranslations } from 'next-intl';

export default function BigSection() {
  const t = useTranslations('Home.BigSection');

  return (
    <section className="w-full py-10 px-20 bg-purple-100 sm:mb-14 mb-12">
      <div className="max-w-screen-lg mx-auto">
        {/* Image Section */}
        <div className="relative w-full">
          <Image
            src={poplineImage}
            alt={t('imageAlt')}
            layout="responsive"
            width={1200}
            height={600}
            className="rounded-lg"
          />
        </div>

        {/* Title and Text */}
        <div className="text-center mt-8">
          <h1 className="text-2xl font-bold text-gray-800">
            {t('title')}
          </h1>
          <p className="mt-4 text-md text-gray-600">
            {t('description1')}
          </p>
          <p className="text-md text-gray-600">
            {t('description2')}
          </p>
        </div>

        {/* Badges Section */}
        <div className="flex justify-center gap-2 mt-6">
          <Badge className="text-sm px-2 py-2 bg-blueKommo">
            {t('badge1')}
          </Badge>
          <Badge className="text-sm  px-4 py-2 bg-blueKommo">
            {t('badge2')}
          </Badge>
          <Badge className="text-sm  px-4 py-2 bg-blueKommo">
            {t('badge3')}
          </Badge>
        </div>
      </div>
    </section>
  );
}


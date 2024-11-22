"use client";

import { useTranslations } from 'next-intl';
import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { X } from "@phosphor-icons/react";

const renderContent = (content: string | boolean) => {
  if (typeof content === "boolean") {
    return content ? (
      <Check className="w-6 h-6 text-green-500" />
    ) : (
      <X className="w-6 h-6 text-red-500" />
    );
  }
  return <span className="text-gray-700">{content}</span>;
};

export default function PricingTable() {
  const t = useTranslations('PricingTable');

  const pricingData = [
    {
      title: t('features.accountLimit.title'),
      description: t('features.accountLimit.description'),
      base: t('features.accountLimit.base'),
      professional: t('features.accountLimit.professional'),
      custom: t('features.accountLimit.custom'),
    },
    {
      title: t('features.contentPlanning.title'),
      description: t('features.contentPlanning.description'),
      base: true,
      professional: true,
      custom: true,
    },
    {
      title: t('features.storage.title'),
      description: t('features.storage.description'),
      base: t('features.storage.base'),
      professional: t('features.storage.professional'),
      custom: t('features.storage.custom'),
    },
    // Add more features here...
  ];

  return (
    <div className="w-full max-w-[80rem] mx-auto px-4 rounded-2xl overflow-hidden">
      <div className="w-full flex flex-col text-right rounded-2xl overflow-hidden">
        <div className="bg-purple-100 w-full flex rounded-t-2xl justify-around  ">
          <div className="py-4 hidden md:block">{t('plan')}</div>
          <div className="py-4 md:pr-8 ">{t('base')}</div>
          <div className="py-4 md:pr-4 ">{t('professional')}</div>
          <div className="py-4 md:-pr-8 ">{t('custom')}</div>
        </div>
        <div className="w-full flex flex-col justify-evenly">
          {pricingData.map((item, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col md:flex-row items-center bg-purple-50 border-b pb-4 md:pb-0">
                <div className="py-3 md:px-4 w-full px-4 md:w-1/4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value={`item-${index}`} className="w-full">
                      <AccordionTrigger className="w-full text-lg font-semibold text-blueKommo rounded-2xl">
                        {item.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-blueKommo">{item.description}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                <div className="flex w-full md:w-3/4">
                  <div className="flex justify-around bg-purple-50 md:bg-purple-50 py-3  w-full">
                    {renderContent(item.base)}
                  </div>
                  <div className="flex justify-around bg-purple-50 md:bg-purple-50  py-3  w-full">
                    {renderContent(item.professional)}
                  </div>
                  <div className="flex justify-around bg-purple-50 md:bg-purple-50  py-3  w-full">
                    {renderContent(item.custom)}
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}


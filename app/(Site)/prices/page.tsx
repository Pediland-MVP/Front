"use client";

import { useTranslations } from 'next-intl';
import React from "react";
import Prices from "../components/prices";
import FrequentlyQuestions from "./(components)/FrequentlyQuestions";
import PricingTable from "./(components)/featuresTable";

export default function PricingPage() {
  const t = useTranslations('PricingPage');

  return (
    <>
      <div className="mt-[10rem] w-full leading-9 max-w-[80rem] mx-auto px-4 mb-6">
        <h1 className="text-blueKommo text-2xl leading-120 font-medium md:text-2xl lg:leading-[3rem] lg:text-[38px]">
          {t('header')}
        </h1>
        <p>
          {t('subheader')}
        </p>
      </div>
      <Prices />
      <div className="w-full leading-9 max-w-[80rem] mx-auto px-8 mb-6">
        <h1 className="text-blueKommo text-2xl leading-120 font-medium md:text-2xl lg:leading-[3rem] lg:text-[38px]">
          {t('faqTitle')}
        </h1>
      </div>
      <FrequentlyQuestions
        faqs={[
          {
            question: t('faq.q1'),
            answer: t('faq.a1'),
          },
          {
            question: t('faq.q2'),
            answer: t('faq.a2'),
          },
          {
            question: t('faq.q3'),
            answer: t('faq.a3'),
          },
          {
            question: t('faq.q4'),
            answer: t('faq.a4'),
          },
        ]}
      />
      <PricingTable />
    </>
  );
}


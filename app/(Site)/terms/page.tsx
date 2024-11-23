"use client"

import { useTranslations } from 'next-intl';
import React from 'react';

export default function TermsPage() {
  const t = useTranslations('TermsAndConditions');

  return (
    <div className='w-full max-w-[72rem] flex flex-col mx-auto md:mt-[4rem] mt-6'>
      <div className="px-8 md:py-8 mt-8 bg-white rounded-lg">      
        <h1 className="text-4xl font-semibold -mb-2">{t('title')}</h1>
        <section className="text-lg leading-7">
          <h3 className="text-3xl font-semibold mb-4 mt-12">{t('introduction.title')}</h3>
          <p className="mb-4">{t('introduction.paragraph1')}</p>
          <p className="mb-4">{t('introduction.paragraph2')}</p>
          <p className="mb-4">{t('introduction.paragraph3')}</p>

          <h3 className="text-3xl font-semibold mb-4 mt-12">{t('generalRules.title')}</h3>
          <ul className="list-disc pl-5 mb-4 px-10">
            {Array.from({ length: 11 }, (_, i) => (
              <li key={i} className="mb-2">{t(`generalRules.rule${i + 1}`)}</li>
            ))}
          </ul>

          <h3 className="text-3xl font-semibold mb-4 mt-12">{t('registrationConditions.title')}</h3>
          <ul className="list-disc pl-5 mb-4 px-10">
            {Array.from({ length: 7 }, (_, i) => (
              <li key={i} className="mb-2">{t(`registrationConditions.condition${i + 1}`)}</li>
            ))}
          </ul>

          <h3 className="text-3xl font-semibold mb-4 mt-12">{t('informationChange.title')}</h3>
          <ul className="list-disc pl-5 mb-4 px-10">
            {Array.from({ length: 2 }, (_, i) => (
              <li key={i} className="mb-2">{t(`informationChange.point${i + 1}`)}</li>
            ))}
          </ul>

          <h3 className="text-3xl font-semibold mb-4 mt-12">{t('confidentiality.title')}</h3>
          <ul className="list-disc pl-5 mb-4 px-10">
            {Array.from({ length: 2 }, (_, i) => (
              <li key={i} className="mb-2">{t(`confidentiality.point${i + 1}`)}</li>
            ))}
          </ul>

          <h3 className="text-3xl font-semibold mb-4 mt-12">{t('paymentAndRefund.title')}</h3>
          <ul className="list-disc pl-5 mb-4 px-10">
            {Array.from({ length: 2 }, (_, i) => (
              <li key={i} className="mb-2">{t(`paymentAndRefund.point${i + 1}`)}</li>
            ))}
          </ul>

          <h3 className="text-3xl font-semibold mb-4 mt-12">{t('otherCases.title')}</h3>
          <ul className="list-disc pl-5 mb-4 px-10">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="mb-2">{t(`otherCases.point${i + 1}`)}</li>
            ))}
          </ul>

          <h3 className="text-3xl font-semibold mb-4 mt-12">{t('forceMajeure.title')}</h3>
          <p className="mb-4">{t('forceMajeure.description')}</p>

          <h3 className="text-3xl font-semibold mb-4 mt-12">{t('disputeResolution.title')}</h3>
          <p>{t('disputeResolution.description')}</p>
        </section>
      </div>
    </div>
  );
}


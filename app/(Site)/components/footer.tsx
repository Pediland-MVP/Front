"use client";

import React from "react";
import { useTranslations } from 'next-intl';
import {
  FacebookLogo,
  TwitterLogo,
  InstagramLogo,
  LinkedinLogo,
} from "@phosphor-icons/react";

export default function Footer() {
  const t = useTranslations('Home.Footer');

  const footerColumns = [
    {
      title: t('company'),
      links: ['aboutUs', 'careers', 'media', 'blog'],
    },
    {
      title: t('support'),
      links: ['helpCenter', 'contactUs', 'faq', 'terms'],
    },
    {
      title: t('services'),
      links: ['consulting', 'sales', 'marketing', 'customerService'],
    },
    {
      title: t('support'),
      links: ['helpCenter', 'contactUs', 'faq', 'terms'],
    },
  ];

  const socialIcons = [
    { Icon: FacebookLogo, label: 'Facebook' },
    { Icon: TwitterLogo, label: 'Twitter' },
    { Icon: InstagramLogo, label: 'Instagram' },
    { Icon: LinkedinLogo, label: 'LinkedIn' },
  ];

  return (
    <div className="md:mt-24 mt-16">
      <footer className="bg-blueKommo mt-auto pt-8 rounded-t-2xl px-4 md:px-8">
        <div className="container mx-auto rounded-t-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pb-8 justify-items-center mx-auto">
            {footerColumns.map((column, index) => (
              <div key={index}>
                <h3 className="text-sm md:text-md font-semibold mb-4 text-white">
                  {column.title}
                </h3>
                <ul className="leading-8 md:leading-[2.5rem] text-xs">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-100 hover:text-gray-400">
                        {t(link)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-b text-center pb-8">
            <h3 className="text-sm md:text-md font-semibold mb-4 text-white">
              {t('followUs')}
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {socialIcons.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="text-white hover:text-purple-700"
                >
                  <Icon size={28} />
                </a>
              ))}
            </div>
          </div>
          <h4 className="text-center m-auto py-4 text-white text-xs md:font-light">
            {t('copyright')}
          </h4>
        </div>
      </footer>
    </div>
  );
}


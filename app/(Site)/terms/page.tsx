"use client";

import { useTranslations } from "next-intl";
import React from "react";

export default function TermsPage() {
  const t = useTranslations("TermsAndConditions");

  return (
    <div className="w-full max-w-[72rem] flex flex-col mx-auto md:mt-[4rem] mt-6">
      <div className="px-8 md:py-8 mt-8 bg-white rounded-lg">
        <h1 className="text-4xl font-semibold -mb-2">{t("title")}</h1>
        <section className="text-lg leading-7">
          <h3 className="text-3xl font-semibold mb-4 mt-12">
            {t("introduction.title")}
          </h3>
          <p className="mb-4">{t("introduction.paragraph1")}</p>

          <h3 className="text-3xl font-semibold mb-4 mt-12">
            {t("sections.0.title")}
          </h3>
          <p className="mb-4">{t("sections.0.paragraph1")}</p>

          <h3 className="text-3xl font-semibold mb-4 mt-12">
            {t("sections.1.title")}
          </h3>
          <p className="mb-4">{t("sections.1.paragraph1")}</p>

          <h3 className="text-3xl font-semibold mb-4 mt-12">
            {t("sections.2.title")}
          </h3>
          <p className="mb-4">{t("sections.2.paragraph1")}</p>

          <h3 className="text-3xl font-semibold mb-4 mt-12">
            {t("sections.3.title")}
          </h3>
          <p className="mb-4">{t("sections.3.paragraph1")}</p>

          <h3 className="text-3xl font-semibold mb-4 mt-12">
            {t("sections.4.title")}
          </h3>
          <p className="mb-4">{t("sections.4.paragraph1")}</p>

          <h3 className="text-3xl font-semibold mb-4 mt-12">
            {t("sections.5.title")}
          </h3>
          <p className="mb-4">{t("sections.5.paragraph1")}</p>

          <h3 className="text-3xl font-semibold mb-4 mt-12">
            {t("sections.6.title")}
          </h3>
          <p className="mb-4">{t("sections.6.paragraph1")}</p>

          <h3 className="text-3xl font-semibold mb-4 mt-12">
            {t("disclaimer.title")}
          </h3>
          <p className="mb-4">{t("disclaimer.paragraph1")}</p>
        </section>
      </div>
    </div>
  );
}

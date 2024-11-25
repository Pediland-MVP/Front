"use client";

import { useTranslations } from "next-intl";
import React from "react";

export default function PrivacyPage() {
  const t = useTranslations("PrivacyPolicy");

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
            {t("informationWeCollect.title")}
          </h3>
          <p className="mb-4">{t("informationWeCollect.paragraph1")}</p>
          <ul className="list-disc pl-5 mb-4 px-10">
            <li className="mb-2">
              <strong>{t("informationWeCollect.point1Title")}:</strong>
              {t("informationWeCollect.point1Text")}
            </li>
            <li className="mb-2">
              <strong>{t("informationWeCollect.point2Title")}:</strong>
              {t("informationWeCollect.point2Text")}
            </li>
            <li className="mb-2">
              <strong>{t("informationWeCollect.point3Title")}:</strong>
              {t("informationWeCollect.point3Text")}
            </li>
          </ul>

          <h3 className="text-3xl font-semibold mb-4 mt-12">
            {t("howWeUseYourInformation.title")}
          </h3>
          <p className="mb-4">{t("howWeUseYourInformation.paragraph1")}</p>
          <ul className="list-disc pl-5 mb-4 px-10">
            <li className="mb-2">{t("howWeUseYourInformation.point1Text")}</li>
            <li className="mb-2">{t("howWeUseYourInformation.point2Text")}</li>
            <li className="mb-2">{t("howWeUseYourInformation.point3Text")}</li>
            <li className="mb-2">{t("howWeUseYourInformation.point4Text")}</li>
          </ul>

          <h3 className="text-3xl font-semibold mb-4 mt-12">
            {t("sharingYourInformation.title")}
          </h3>
          <p className="mb-4">{t("sharingYourInformation.paragraph1")}</p>
          <ul className="list-disc pl-5 mb-4 px-10">
            <li className="mb-2">
              <strong>{t("sharingYourInformation.point1Title")}:</strong>
              {t("sharingYourInformation.point1Text")}
            </li>
            <li className="mb-2">
              <strong>{t("sharingYourInformation.point2Title")}:</strong>
              {t("sharingYourInformation.point2Text")}
            </li>
          </ul>

          <h3 className="text-3xl font-semibold mb-4 mt-12">
            {t("dataSecurity.title")}
          </h3>
          <p className="mb-4">{t("dataSecurity.paragraph1")}</p>

          <h3 className="text-3xl font-semibold mb-4 mt-12">
            {t("yourRights.title")}
          </h3>
          <p className="mb-4">{t("yourRights.paragraph1")}</p>
          <ul className="list-disc pl-5 mb-4 px-10">
            <li className="mb-2">{t("yourRights.point1Text")}</li>
            <li className="mb-2">{t("yourRights.point2Text")}</li>
            <li className="mb-2">{t("yourRights.point3Text")}</li>
          </ul>

          <h3 className="text-3xl font-semibold mb-4 mt-12">
            {t("changesToThisPrivacyPolicy.title")}
          </h3>
          <p className="mb-4">{t("changesToThisPrivacyPolicy.paragraph1")}</p>

          <h3 className="text-3xl font-semibold mb-4 mt-12">
            {t("contactUs.title")}
          </h3>
          <p>{t("contactUs.paragraph1")}</p>
        </section>
      </div>
    </div>
  );
}

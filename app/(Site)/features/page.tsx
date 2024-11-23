import React from "react";
import HeroSectionFeatures from "./(components)/heroSecton";
import BigSection from "./(components)/bigSection";
import ExplainApp from "../components/explainApp";
import screenShotExplain from "@/public/profile-ui-kommo.png";
import screenShot1 from "@/public/kommo-profile.png";
import ExplainMore2 from "../components/explainMore2";
import ExplainFeaturesSquare from "../components/explainFeaturesSquare";
import ExplainFeatures from "../components/explainFeatures";
import FeatureBox from "./(components)/featureBox";
import { useTranslations } from "next-intl";

export default function page() {
  const t = useTranslations('Features')
  return (
    <>
      <HeroSectionFeatures />
      <BigSection />
      <ExplainApp
        title={t('s')}
        text={t('p')}
        srcPic={screenShotExplain}
        picCoverSize="xl:pl-[3.5rem] xl:pt-[3.5rem] md:pl-[2.5rem] md:pt-[2.5rem] pt-[1rem] pl-[1rem] bg-yellow-100 "
      />
      <ExplainApp
        flex="flex-col xl:flex-row-reverse"
        title={t('s')}
        text={t('p')}
        srcPic={screenShotExplain}
        picCoverSize="xl:pr-[3.5rem] xl:pt-[3.5rem] md:pr-[2rem] md:pt-[2rem] pt-[1rem] pr-[1rem] bg-pink-200 "
      />
      <ExplainApp
        title={t('s')}
        text={t('p')}
        srcPic={screenShotExplain}
        picCoverSize="xl:pr-[3.5rem] xl:pb-[3.5rem] md:pr-[2rem] md:pb-[2rem] pb-[1rem] pr-[1rem] bg-blue-200 "
      />
      <ExplainMore2 />
      <ExplainFeatures
        flex="sm:flex-row"
        bg="bg-purple-100"
        picCoverBg="bg-blue-700"
        picCoverSize="md:pl-[2rem] md:pt-[2rem] pt-[1rem] pl-[1rem]"
        srcPic={screenShot1}
        title={t('xs')}
        text={t('p')}
      />
      <div className="w-full xl:max-w-[80rem] xl:mx-auto xl:flex xl:justify-between xl:gap-4">
        <ExplainFeaturesSquare
          flex=""
          bg="bg-purple-100"
          picCoverBg="bg-blue-700"
          picCoverSize="md:pl-[2rem] md:pt-[2rem] pt-[1rem] pl-[1rem]"
          srcPic={screenShot1}
          title={t('xs')}
          text={t('p')}
        />{" "}
        <ExplainFeaturesSquare
          flex=""
          bg="bg-purple-100"
          picCoverBg="bg-blue-700"
          picCoverSize="md:pl-[2rem] md:pt-[2rem] pt-[1rem] pl-[1rem]"
          srcPic={screenShot1}
          title={t('xs')}
          text={t('p')}
        />
      </div>

      <FeatureBox
        features={[
          {
            title: t('tasks.title'),
            text: t('tasks.description'),
          },
          {
            title: t('chat.title'),
            text: t('chat.description'),
          },
          {
            title: t('analytics.title'),
            text: t('analytics.description'),
          },
          {
            title: t('form.title'),
            text: t('form.description'),
          },
          {
            title: t('chatButton.title'),
            text: t('chatButton.description'),
          },
          {
            title: t('merge.title'),
            text: t('merge.description'),
          },
        ]}
      />
    </>
  );
}

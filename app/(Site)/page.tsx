import { styles } from "@/registry/styles";
import React from "react";
import HeroSection from "./components/heroSection";
import ExplainApp from "./components/explainApp";
import SecOne from "./components/secOne";
import ExplainMore2 from "./components/explainMore2";
import ExplainFeatures from "./components/explainFeatures";
import screenShot1 from "@/public/kommo-profile.png";
import Prices from "./components/prices";
import { UserComments } from "./components/userComments";
import screenShotExplain from "@/public/profile-ui-kommo.png";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("Lorem");
  return (
    <main className="mt-20">
      <HeroSection />

      <SecOne />

      <ExplainApp
        title={t("title")}
        text={t("p")}
        srcPic={screenShotExplain}
        picCoverSize="xl:pl-[3.5rem] xl:pt-[3.5rem] md:pl-[2rem] md:pt-[2rem] pt-[1rem] pl-[1rem] bg-yellow-100 "
      />

      <ExplainApp
        flex="flex-col xl:flex-row-reverse"
        title={t("title")}
        text={t("p")}
        srcPic={screenShotExplain}
        picCoverSize="xl:pr-[3.5rem] xl:pt-[3.5rem] md:pr-[2rem] md:pt-[2rem] pt-[1rem] pr-[1rem] bg-pink-200 "
      />

      <ExplainApp
        title={t("title")}
        text={t("p")}
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
        text={t("s")}
        title={t("xs")}
      />

      <ExplainFeatures
        flex="sm:flex-row-reverse"
        bg="bg-purple-100"
        picCoverBg="bg-yellow-300"
        picCoverSize="md:pr-[2rem] md:pt-[2rem] pt-[1rem] pr-[1rem]"
        srcPic={screenShot1}
        text={t("s")}
        title={t("xs")}
      />

      <ExplainFeatures
        flex="sm:flex-row"
        bg="bg-purple-100"
        picCoverBg="bg-pink-400"
        picCoverSize="md:pl-[2rem] md:pt-[2rem] pt-[1rem] pl-[1rem]"
        srcPic={screenShot1}
        text={t("s")}
        title={t("xs")}
      />

      {/* <Prices /> */}

      <ExplainMore2 />

      {/* <UserComments /> */}
    </main>
  );
}

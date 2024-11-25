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
import SecTwo from "./components/secTwo";
import Features from "./components/features";

export default function Home() {
  const t = useTranslations("Lorem");

  return (
    <main className="mt-20">
      <HeroSection />

      <SecOne />

      <Features />

      {/* <ExplainApp
        title={t("title")}
        text={t("p")}
        srcPic={screenShotExplain}
        picCoverSize="xl:pl-[3.5rem] xl:pt-[3.5rem] md:pl-[2rem] md:pt-[2rem] pt-[1rem] pl-[1rem] bg-yellow-100 "
      /> */}

      {/* <ExplainFeatures
        flex="sm:flex-row"
        bg="bg-purple-100"
        picCoverBg="bg-pink-400"
        picCoverSize="md:pl-[2rem] md:pt-[2rem] pt-[1rem] pl-[1rem]"
        srcPic={screenShot1}
        text={t("s")}
        title={t("xs")}
      /> */}

      {/* <Prices /> */}

      <SecTwo />

      {/* <UserComments /> */}
    </main>
  );
}

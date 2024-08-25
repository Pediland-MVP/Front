import { styles } from "@/registry/styles";
import React from "react";
import HeroSection from "./components/heroSection";
import ExplainApp from "./components/explainApp";
import ExplainMore from "./components/explainMore";
import ExplainMore2 from "./components/explainMore2";
import ExplainFeatures from "./components/explainFeatures";
import screenShot1 from "@/public/kommo-profile.png";
import Prices from "./components/prices";
import { UserComments } from "./components/userComments";
import screenShotExplain from "@/public/profile-ui-kommo.png";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ExplainMore />
      <ExplainApp
        title={`لورم ایپسوم متن ساختگی  تولید سادگی نامفهوم از صنعت چاپ`}
        text="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با
            استفاده از طراحان گرافیک است چاپگرها و متون بلکه روزنامه و مجله در
            ستون و سطرآنچنان که لازم است"
        srcPic={screenShotExplain}
        picCoverSize="xl:pl-[3.5rem] xl:pt-[3.5rem] md:pl-[2rem] md:pt-[2rem] pt-[1rem] pl-[1rem] bg-yellow-100 "
      />
      <ExplainApp
        flex="flex-col xl:flex-row-reverse"
        title={`لورم ایپسوم متن ساختگی  تولید سادگی نامفهوم از صنعت چاپ`}
        text="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با
            استفاده از طراحان گرافیک است چاپگرها و متون بلکه روزنامه و مجله در
            ستون و سطرآنچنان که لازم است"
        srcPic={screenShotExplain}
        picCoverSize="xl:pr-[3.5rem] xl:pt-[3.5rem] md:pr-[2rem] md:pt-[2rem] pt-[1rem] pr-[1rem] bg-pink-200 "
      />
      <ExplainApp
        title={`لورم ایپسوم متن ساختگی  تولید سادگی نامفهوم از صنعت چاپ`}
        text="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با
            استفاده از طراحان گرافیک است چاپگرها و متون بلکه روزنامه و مجله در
            ستون و سطرآنچنان که لازم است"
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
        text="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گراف و مجله در"
        title="تولید سادگی نامفهوم"
      />
      <ExplainFeatures
        flex="sm:flex-row-reverse"
        bg="bg-purple-100"
        picCoverBg="bg-yellow-300"
        picCoverSize="md:pr-[2rem] md:pt-[2rem] pt-[1rem] pr-[1rem]"
        srcPic={screenShot1}
        text="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گراف و مجله در"
        title="تولید سادگی نامفهوم"
      />
      <ExplainFeatures
        flex="sm:flex-row"
        bg="bg-purple-100"
        picCoverBg="bg-pink-400"
        picCoverSize="md:pl-[2rem] md:pt-[2rem] pt-[1rem] pl-[1rem]"
        srcPic={screenShot1}
        text="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گراف و مجله در"
        title="تولید سادگی نامفهوم"
      />
      <div className="md:mt-24 mt-12">
        <ExplainMore2 />
      </div>
      <Prices />
      <div className="">
        <ExplainMore2 />
      </div>
      <UserComments />
      {/* <div className="mt-32">
        <ExplainMore2 />
      </div> */}
    </>
  );
}

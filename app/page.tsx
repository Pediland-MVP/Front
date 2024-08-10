import { styles } from "@/registry/styles";
import React from "react";
import Header from "./layout/header";
import HeroSection from "./(layout)/components/heroSection";
import ExplainApp from "./(layout)/components/explainApp";
import ExplainApp2 from "./(layout)/components/explainApp2";
import ExplainApp3 from "./(layout)/components/explainApp3";
import ExplainMore from "./(layout)/components/explainMore";
import ExplainMore2 from "./(layout)/components/explainMore2";
import ExplainFeatures from "./(layout)/components/explainFeatures";
import screenShot1 from "../public/kommo-profile.png";
import Prices from "./(layout)/components/prices";
import { UserComments } from "./(layout)/components/userComments";
import Footer from "./(layout)/components/footer";
// import { UserComments } from "./(layout)/components/userComments";
// import UserComments  from "./(layout)/components/userComments";
export default function Home() {
  return (
    <>
      <HeroSection />
      <ExplainMore />
      <ExplainApp />
      <ExplainApp2 />
      <ExplainApp3 />
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
      <div className="mt-32">
        <ExplainMore2 />
      </div>
      <Prices />
      <div className="mt-32">
        <ExplainMore2 />
      </div>
      <UserComments />
      {/* <div className="mt-32">
        <ExplainMore2 />
      </div> */}

      <Footer/>
    </>
  );
}

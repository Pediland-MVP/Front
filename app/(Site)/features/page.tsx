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

export default function page() {
  return (
    <>
      <HeroSectionFeatures />
      <BigSection />
      <ExplainApp
        title={`لورم ایپسوم متن ساختگی  تولید سادگی نامفهوم از صنعت چاپ`}
        text="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با
            استفاده از طراحان گرافیک است چاپگرها و متون بلکه روزنامه و مجله در
            ستون و سطرآنچنان که لازم است"
        srcPic={screenShotExplain}
        picCoverSize="xl:pl-[3.5rem] xl:pt-[3.5rem] md:pl-[2.5rem] md:pt-[2.5rem] pt-[1rem] pl-[1rem] bg-yellow-100 "
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
      <div className="w-full xl:max-w-[80rem] xl:mx-auto xl:flex xl:justify-between xl:gap-4">
        <ExplainFeaturesSquare
          flex=""
          bg="bg-purple-100"
          picCoverBg="bg-blue-700"
          picCoverSize="md:pl-[2rem] md:pt-[2rem] pt-[1rem] pl-[1rem]"
          srcPic={screenShot1}
          text="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گراف و مجله در"
          title="تولید سادگی نامفهوم"
        />{" "}
        <ExplainFeaturesSquare
          flex=""
          bg="bg-purple-100"
          picCoverBg="bg-blue-700"
          picCoverSize="md:pl-[2rem] md:pt-[2rem] pt-[1rem] pl-[1rem]"
          srcPic={screenShot1}
          text="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گراف و مجله در"
          title="تولید سادگی نامفهوم"
        />
      </div>

      <FeatureBox
        features={[
          {
            title: "وظایف",
            text: "یادآوری‌ها را در پروفایل‌های مشتری تنظیم کنید و تقویم خود را مدیریت کنید",
          },
          {
            title: "چت تیمی",
            text: "با همکاران به صورت خصوصی، در چت‌های گروهی یا مستقیماً در پروفایل‌های مشتری چت کنید",
          },
          {
            title: "تحلیل‌ها",
            text: "عملکرد را با گزارش‌های لحظه‌ای و داشبوردهای قابل تنظیم ردیابی کنید",
          },
          {
            title: "فرم‌های وب",
            text: "فرم‌های زیبایی طراحی کنید که مشتریان را مستقیماً به خط لوله فروش شما هدایت می‌کنند",
          },
          {
            title: "دکمه چت",
            text: "دکمه چت چند مسنجر خود را سفارشی کنید، دقیقاً مانند چیزی که در این صفحه می‌بینید",
          },
          {
            title: "ادغام‌ها",
            text: "برنامه‌هایی که دوست دارید مستقیماً با کومو ادغام می‌شوند تا جریان کاری شما یکپارچه شود",
          },
        ]}
      />
    </>
  );
}

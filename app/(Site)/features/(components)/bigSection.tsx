import React from "react";
import Image from "next/image";
import { Badge } from "@/registry/new-york/ui/badge";
// import { Badge } from "@/components/ui/badge";
import poplineImage from "@/public/pipeline-image-kommo.png";
export default function BigSection() {
  return (
    <section className="w-full py-10 px-20 bg-purple-100 sm:mb-14 mb-12">
      <div className="max-w-screen-lg mx-auto">
        {/* Image Section */}
        <div className="relative w-full">
          <Image
            src={poplineImage}
            alt="CRM Pipeline"
            layout="responsive"
            width={1200}
            height={600}
            className="rounded-lg"
          />
        </div>

        {/* Title and Text */}
        <div className="text-center mt-8">
          <h1 className="text-2xl font-bold text-gray-800">
            تجربه CRM خود را بهبود بخشید
          </h1>
          <p className="mt-4 text-md text-gray-600">
            مدیریت فروش خود را با ابزارهای CRM ما به صورت کارآمد انجام
            دهید.
          </p>
          <p className="text-md text-gray-600">
            جریان کاری خود را سفارشی کنید و بهره‌وری را افزایش دهید.
          </p>
        </div>

        {/* Badges Section */}
        <div className="flex justify-center gap-2 mt-6">
          <Badge className="text-sm px-2 py-2 bg-blueKommo">
            رابط کاربری ساده
          </Badge>
          <Badge className="text-sm  px-4 py-2 bg-blueKommo">
            کاملاً قابل سفارشی‌سازی
          </Badge>
          <Badge className="text-sm  px-4 py-2 bg-blueKommo">
            پشتیبانی 
          </Badge>
        </div>
      </div>
    </section>
  );
}

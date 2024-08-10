"use client";
import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/registry/new-york/ui/carousel";
// import ExplainFeatures from "@/components/ExplainFeatures";
import kommoProfile from "../../../public/kommo-profile.png"; // Example static image
import UserCommentsCard from "./userCommentsCard";

export function UserComments() {
  return (
    <Carousel
      dir="ltr"
      opts={{
        align: "start",
      }}
      className="h-full"
    >
      <div className="w-full  max-w-[102rem] mx-auto lg:text-right text-center">
        <h1 className="font-semibold md:text-2xl py-8 text-xl" >نظرات دیگران راجب مارا بخوانید</h1>
      </div>
      <CarouselContent className="flex ">
        {Array.from({ length: 10 }).map((_, index) => (
          <CarouselItem
            key={index}
            className="basis-[90%] md:basis-[90%] lg:basis-[75%] xl:basis-[47%]"
          >
            <div className=" h-full">
              {/* <Card className="flex h-full"> */}
              <CardContent className="">
                <UserCommentsCard
                  flex="md:flex-row"
                  bg="bg-purple-200"
                  picCoverSize="w-full h-full object-contain rounded-lg"
                  picCoverBg="bg-gray-200"
                  srcPic="https://pcfcdn.kommo.com/images/main/crm-for-finance.jpg" // Replace with your actual image path
                  title={`سینا پیرانی ${index + 1}`}
                  text="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گراف و مجله در"
                />
              </CardContent>
              {/* </Card> */}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

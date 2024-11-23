"use client";
import { CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/registry/new-york/ui/carousel";
import UserCommentsCard from "./userCommentsCard";
import { useTranslations } from "next-intl";

export function UserComments() {
  const t = useTranslations('UsersComments');
  return (
    <Carousel
      dir="ltr"
      opts={{
        align: "start",
      }}
      className="h-full"
    >
      <div className="w-full  max-w-[102rem] mx-auto lg:text-right text-center">
        <h1 className="font-semibold md:text-2xl pb-8 text-xl" ></h1>
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
                  title={`${t('sina')} ${index + 1}`}
                  text={t('p')}
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

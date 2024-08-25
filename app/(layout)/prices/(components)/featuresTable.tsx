"use client";
import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { X } from "@phosphor-icons/react";

type PlanData = {
  title: string;
  description: string;
  base: string | boolean;
  professional: string | boolean;
  custom: string | boolean;
};

type PricingTableProps = {
  data: PlanData[];
};

const renderContent = (content: string | boolean) => {
  if (typeof content === "boolean") {
    return content ? (
      <Check className="w-6 h-6 text-green-500" />
    ) : (
      <X className="w-6 h-6 text-red-500" />
    );
  }
  return <span className="text-gray-700">{content}</span>;
};

export default function PricingTable({ data }: PricingTableProps) {
  return (
    <div className="w-full max-w-[80rem] mx-auto px-4 rounded-2xl overflow-hidden">
      <div className="w-full flex flex-col text-right rounded-2xl overflow-hidden">
        <div className="bg-purple-100 w-full flex rounded-t-2xl justify-around  ">
          <div className="py-4 hidden md:block">طرح</div>
          <div className="py-4 md:pr-8 ">پایه</div>
          <div className="py-4 md:pr-4 ">حرفه‌ای</div>
          <div className="py-4 md:-pr-8 ">سفارشی</div>
        </div>
        <div className="w-full flex flex-col justify-evenly">
          {data?.map((item, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col md:flex-row items-center bg-purple-50 border-b pb-4 md:pb-0">
                <div className="py-3 md:px-4 w-full px-4 md:w-1/4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value={`item-${index}`} className="w-full">
                      <AccordionTrigger className="w-full text-lg font-semibold text-blueKommo rounded-2xl">
                        {item.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-blueKommo">{item.description}</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                <div className="flex w-full md:w-3/4">
                  <div className="flex justify-around bg-purple-50 md:bg-purple-50 py-3  w-full">
                    {renderContent(item.base)}
                  </div>
                  <div className="flex justify-around bg-purple-50 md:bg-purple-50  py-3  w-full">
                    {renderContent(item.professional)}
                  </div>
                  <div className="flex justify-around bg-purple-50 md:bg-purple-50  py-3  w-full">
                    {renderContent(item.custom)}
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

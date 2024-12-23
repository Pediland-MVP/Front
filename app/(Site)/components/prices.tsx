"use client";

import React from "react";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/theme/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";



export default function Prices() {
  const t = useTranslations('Prices');

  const renderPlanCard = (plan: string, period: string) => (
    <Card className="flex-1 bg-white rounded-xl overflow-hidden">
      <CardHeader className="bg-purple-100 p-6">
        <CardTitle className="text-lg font-bold text-blueKommo">
          {t(`plans.${plan}.title`)}
        </CardTitle>
        <CardDescription className="text-2xl text-blueKommo font-bold mt-2">
          {t(`plans.${plan}.price.${period}`)}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <ul className="text-sm leading-loose text-blueKommo">
          <li>{t(`plans.${plan}.features.1`)}</li>
          <li>{t(`plans.${plan}.features.2`)}</li>
          <li>{t(`plans.${plan}.features.3`)}</li>
          <li>{t(`plans.${plan}.features.4`)}</li>
          <li className="text-blueKommo font-semibold mt-4 hover:underline cursor-pointer hover:text-purple-400">
            {t('viewAllFeatures')}
          </li>
        </ul>
      </CardContent>
      <CardFooter className="p-6">
        <Button className="w-full bg-blueKommo text-white py-3">
          {t('subscribe')}
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="w-full max-w-[90rem] mx-auto md:px-16 px-4 mb-16 md:mb-24">
      <Tabs
        defaultValue="monthly"
        className="w-full flex flex-col items-center text-right"
        dir="rtl"
      >
        <TabsList className="w-[20rem] m-auto pb-1 grid grid-cols-2 -gray-300 rounded-xl overflow-hidden">
          <TabsTrigger value="monthly" className="font-semibold">
            {t('periods.monthly')}
          </TabsTrigger>
          <TabsTrigger value="yearly" className="font-semibold">
            {t('periods.yearly')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="w-full mt-8">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            {renderPlanCard('basic', 'monthly')}
            {renderPlanCard('professional', 'monthly')}
            {renderPlanCard('advanced', 'monthly')}
          </div>
        </TabsContent>

        <TabsContent value="yearly" className="w-full mt-8">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            {renderPlanCard('basic', 'yearly')}
            {renderPlanCard('professional', 'yearly')}
            {renderPlanCard('advanced', 'yearly')}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


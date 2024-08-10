import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/new-york/ui/tabs";

export default function Prices() {
  return (
    <div className="w-full max-w-[90rem] mx-auto md:px-16 px-4 ">
      <Tabs
        defaultValue="monthly"
        className="w-full flex flex-col items-center text-right"
        dir="rtl"
      >
        {/* TabsList with fixed width of 20rem */}
        <TabsList className="w-[20rem] m-auto pb-1 grid grid-cols-2  -gray-300 rounded-xl overflow-hidden">
          <TabsTrigger value="monthly" className="font-semibold">
            ماهانه
          </TabsTrigger>
          <TabsTrigger value="yearly" className=" font-semibold">
            سالانه
          </TabsTrigger>
        </TabsList>

        {/* Monthly Pricing */}
        <TabsContent value="monthly" className="w-full mt-8">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <Card className="flex-1 bg-white rounded-xl overflow-hidden">
              <CardHeader className="bg-purple-100 p-6">
                <CardTitle className="text-lg font-bold text-blueKommo">
                  پایه
                </CardTitle>
                <CardDescription className="text-2xl text-blueKommo font-bold mt-2">
                  ۴۹۹ هزار تومان / ماهانه
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="text-sm leading-loose text-blueKommo">
                  <li>اتصال تا ۵ اکانت شبکه اجتماعی</li>
                  <li>۱ کاربر (بدون هم‌تیمی)</li>
                  <li>۲ گیگابایت فضای ذخیره‌سازی</li>
                  <li>
                    پاسخ هوشمند (تلگرام، اینستاگرام): ۱ اکانت با ۱۰ هزار پاسخ
                    ماهانه
                  </li>
                  <li className="text-blueKommo font-semibold mt-4 hover:underline cursor-pointer hover:text-purple-400">
                    مشاهده همه قابلیت‌ها
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="p-6">
                <Button className="w-full bg-blueKommo text-white py-3">
                  خرید اشتراک
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex-1 bg-white rounded-xl overflow-hidden">
              <CardHeader className="bg-purple-100 p-6">
                <CardTitle className="text-lg font-bold text-blueKommo">
                  حرفه‌ای
                </CardTitle>
                <CardDescription className="text-2xl text-blueKommo font-bold mt-2">
                  ۹۹۹ هزار تومان / ماهانه
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="text-sm leading-loose text-blueKommo">
                  <li>اتصال تا ۱۰ اکانت شبکه اجتماعی</li>
                  <li>۲ کاربر (دسترسی ۱ هم‌تیمی به پنل)</li>
                  <li>۴ گیگابایت فضای ذخیره‌سازی</li>
                  <li>
                    پاسخ هوشمند (تلگرام، اینستاگرام): ۱ اکانت با نامحدود پاسخ
                  </li>
                  <li className="text-blueKommo font-semibold mt-4 hover:underline cursor-pointer hover:text-purple-400">
                    مشاهده همه قابلیت‌ها
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="p-6">
                <Button className="w-full bg-blueKommo text-white py-3">
                  خرید اشتراک
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex-1 bg-white rounded-xl overflow-hidden">
              <CardHeader className="bg-purple-100 p-6">
                <CardTitle className="text-lg font-bold text-blueKommo">
                  پیشرفته
                </CardTitle>
                <CardDescription className="text-2xl text-blueKommo font-bold mt-2">
                  ۲,۹۹۹ هزار تومان / ماهانه
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="text-sm leading-loose text-blueKommo">
                  <li>اتصال تا ۲۵ اکانت شبکه اجتماعی</li>
                  <li>۴ کاربر (دسترسی ۳ هم‌تیمی به پنل)</li>
                  <li>۱۰ گیگابایت فضای ذخیره‌سازی</li>
                  <li>
                    پاسخ هوشمند (تلگرام، اینستاگرام): ۳ اکانت با نامحدود پاسخ
                  </li>
                  <li className="text-blueKommo font-semibold mt-4 hover:underline cursor-pointer hover:text-purple-400">
                    مشاهده همه قابلیت‌ها
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="p-6">
                <Button className="w-full bg-blueKommo text-white py-3">
                  خرید اشتراک
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Yearly Pricing */}
        <TabsContent value="yearly" className="w-full mt-8">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <Card className="flex-1 bg-white rounded-xl overflow-hidden">
              <CardHeader className="bg-purple-100 p-6">
                <CardTitle className="text-lg font-bold text-blueKommo">
                  پایه
                </CardTitle>
                <CardDescription className="text-2xl text-blueKommo font-bold mt-2">
                  ۴,۹۹۰ هزار تومان / سالانه
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="text-sm leading-loose text-blueKommo">
                  <li>اتصال تا ۵ اکانت شبکه اجتماعی</li>
                  <li>۱ کاربر (بدون هم‌تیمی)</li>
                  <li>۲ گیگابایت فضای ذخیره‌سازی</li>
                  <li>
                    پاسخ هوشمند (تلگرام، اینستاگرام): ۱ اکانت با ۱۰ هزار پاسخ
                    ماهانه
                  </li>
                  <li className="text-blueKommo font-semibold mt-4 hover:underline cursor-pointer hover:text-purple-400">
                    مشاهده همه قابلیت‌ها
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="p-6">
                <Button className="w-full bg-blueKommo text-white py-3">
                  خرید اشتراک
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex-1 bg-white rounded-xl overflow-hidden">
              <CardHeader className="bg-purple-100 p-6">
                <CardTitle className="text-lg font-bold text-blueKommo">
                  حرفه‌ای
                </CardTitle>
                <CardDescription className="text-2xl text-blueKommo font-bold mt-2">
                  ۹,۹۹۰ هزار تومان / سالانه
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="text-sm leading-loose text-blueKommo">
                  <li>اتصال تا ۱۰ اکانت شبکه اجتماعی</li>
                  <li>۲ کاربر (دسترسی ۱ هم‌تیمی به پنل)</li>
                  <li>۴ گیگابایت فضای ذخیره‌سازی</li>
                  <li>
                    پاسخ هوشمند (تلگرام، اینستاگرام): ۱ اکانت با نامحدود پاسخ
                  </li>
                  <li className="text-blueKommo font-semibold mt-4 hover:underline cursor-pointer hover:text-purple-400">
                    مشاهده همه قابلیت‌ها
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="p-6">
                <Button className="w-full bg-blueKommo text-white py-3">
                  خرید اشتراک
                </Button>
              </CardFooter>
            </Card>

            <Card className="flex-1 bg-white rounded-xl overflow-hidden">
              <CardHeader className="bg-purple-100 p-6">
                <CardTitle className="text-lg font-bold text-blueKommo">
                  پیشرفته
                </CardTitle>
                <CardDescription className="text-2xl text-blueKommo font-bold mt-2">
                  ۲۹,۹۹۰ هزار تومان / سالانه
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="text-sm leading-loose text-blueKommo">
                  <li>اتصال تا ۲۵ اکانت شبکه اجتماعی</li>
                  <li>۴ کاربر (دسترسی ۳ هم‌تیمی به پنل)</li>
                  <li>۱۰ گیگابایت فضای ذخیره‌سازی</li>
                  <li>
                    پاسخ هوشمند (تلگرام، اینستاگرام): ۳ اکانت با نامحدود پاسخ
                  </li>
                  <li className="text-blueKommo font-semibold mt-4 hover:underline cursor-pointer hover:text-purple-400">
                    مشاهده همه قابلیت‌ها
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="p-6">
                <Button className="w-full bg-blueKommo text-white py-3">
                  خرید اشتراک
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

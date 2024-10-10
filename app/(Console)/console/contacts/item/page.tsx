import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FloppyDisk } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function page() {
    return (
        <div className="flex gap-4 h-full">
            <div className="h-[calc(100vh-2rem)] gap-4 w-2/3 flex flex-col item-center bg-white shadow rounded-2xl p-4">
                <div className="_title font-semibold h-8 border-b border-dashed text-center">
                    <h1>اطلاعات کاربر</h1>
                </div>
                <div className="_wrap h-[calc(100%-48px)] max-h-[calc(100%-48px)] overflow-auto">
                    <div className="flex flex-col items-center gap-2">
                        <Image
                            src={'https://github.com/shadcn.png'}
                            alt={'نام کاربر'}
                            width={64}
                            height={64}
                            className="rounded-full"
                        />
                        <div className="flex flex-col items-center gap-1">
                            <div className="font-medium">فاطمه سلیمانی</div>
                            <div className="text-sm text-gray-500 font-light text-right" dir="ltr">
                                @sinapirani
                            </div>
                        </div>
                    </div>
                    <div className="_form grid grid-cols-6 gap-x-2 gap-y-3 px-10 pt-6 pb-4">
                        <div className="grid w-full items-center gap-2 col-span-2 relative">
                            <Label htmlFor="name">نام</Label>
                            <Select dir="rtl">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="انتخاب کنید" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="female">زن</SelectItem>
                                        <SelectItem value="male">مرد</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>                        </div>
                        <div className="grid w-full items-center gap-2 col-span-2">
                            <Label htmlFor="name">نام خانوادگی</Label>
                            <Input type="text" id="name" />
                        </div>
                        <div className="grid w-full items-center gap-2 col-span-2">
                            <Label htmlFor="name">نام</Label>
                            <Input type="text" id="name" />
                        </div>
                        <div className="grid w-full items-center gap-2 col-span-2">
                            <Label htmlFor="name">کشور</Label>
                            <Input type="text" id="name" />
                        </div>
                        <div className="grid w-full items-center gap-2 col-span-2">
                            <Label htmlFor="name">شهر</Label>
                            <Input type="text" id="name" />
                        </div>
                        <div className="grid w-full items-center gap-2 col-span-2">
                            <Label htmlFor="name">شغل</Label>
                            <Input type="text" id="name" />
                        </div>
                        <div className="grid w-full items-center gap-2 col-span-2">
                            <Label htmlFor="name">ایمیل</Label>
                            <Input type="text" id="name" />
                        </div>
                        <div className="grid w-full items-center gap-2 col-span-2">
                            <Label htmlFor="name">همراه</Label>
                            <Input type="text" id="name" />
                        </div>
                        <div className="grid w-full items-center gap-2 col-span-2">
                            <Label htmlFor="name">تلفن ثابت</Label>
                            <Input type="text" id="name" />
                        </div>
                        <div className="grid w-full gap-2 col-span-6">
                            <Label htmlFor="message">توضیحات</Label>
                            <Textarea id="message" />
                        </div>
                        <Button asChild className="col-span-6">
                            <Link href="#"><FloppyDisk size={22} className="ml-2" />ذخیره اطلاعات</Link>
                        </Button>
                    </div>
                </div>
            </div>
            <div className="h-full w-1/3"></div>
        </div>
    );
}

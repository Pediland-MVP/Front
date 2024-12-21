"use client";

import { useTranslations } from "next-intl";
// Just UI Imports Below
import SidebarTrigger from "@/components/theme/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/theme/ui/breadcrumb";
import Image from "next/image";

export default function ErrorPage() {
    const t = useTranslations("Error");

    return (
        <div className="_accounts h-full">
            <header className="bg-white px-4 py-3 h-16 flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 border-b-2 border-gray-100">
                <div className="_wrap flex items-center gap-4">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="h-6" />

                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/console">{t("dashboard")}</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/console/accounts">{t("accounts")}</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{t('title')}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <div className="_tools">
                </div>
            </header>

            <div className="_error-wrapper flex justify-center items-center h-[calc(100vh-6rem)]">
                <div className="flex flex-col items-center gap-5">
                    <Image src="/images/emojies/frowning-face.webp" alt="404" width={120} height={120} />
                    <p className="text-lg font-medium text-gray-600">متاسفانه مشکلی پیش آمده است.</p>
                </div>
            </div>
        </div>
    );
}   
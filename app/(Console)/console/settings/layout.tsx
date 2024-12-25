"use client"
// UI 
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage
} from "@/components/theme/ui/breadcrumb";
import { SidebarTrigger } from "@/components/theme/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import SettingsNav from "./components/settingsNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const t = useTranslations("Settings");

    return (
        <div className="_settings-page">
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
                                <BreadcrumbPage>{t('title')}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="_wrapper flex w-full min-h-[calc(100vh-5.5rem)]">
                <div className="_settings-nav w-full md:w-1/4">
                    <SettingsNav />
                </div>
                <div className="_settings-content w-full md:w-3/4 ">
                    {children}
                </div>
            </div>
        </div>
    )
}
import { FC } from "react";
import { useTranslations } from "next-intl";
// UI 
import SidebarTrigger from "@/components/theme/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/theme/ui/breadcrumb";

type ProfileLayout = {
    children: React.ReactNode;
};

const ProfileLayout: FC<ProfileLayout> = ({ children }) => {
    const t = useTranslations("Profile");

    return (
        <div className="_profile-page">
            <header className="bg-white px-4 py-3 h-16 flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 border-b-2 border-gray-100">
                <div className="_wrap flex items-center gap-4">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="h-6" />

                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/console">
                                    {t("dashboard")}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{t("title")}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <div className="_tools"></div>
            </header>

            <div className="_profile-layout">
                {children}
            </div>
        </div>
    )
}

export default ProfileLayout

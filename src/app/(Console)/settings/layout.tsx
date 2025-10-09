"use client"
// UI 
import { useTranslations } from "next-intl";
import SettingsNav from "./components/settingsNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const t = useTranslations("Settings");

    return (
        <div className="_settings-page bg-white rounded-t-3xl">
            <div className="_wrapper flex w-full min-h-[calc(100vh-3.25rem)] md:min-h-[calc(100vh-5.5rem)]">
                <div className="_settings-nav hidden sm:block w-full md:w-1/4">
                    <SettingsNav />
                </div>
                <div className="_settings-content w-full md:w-3/4 ">
                    {children}
                </div>
            </div>
        </div>
    )
}
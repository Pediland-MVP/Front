"use client";

import { useTranslations } from "next-intl";
// Just UI Imports Below
import Image from "next/image";
import Link from "next/link";

export default function ErrorPage() {
    const t = useTranslations("Settings.Accounts.Error");

    return (
        <div className="_accounts-error-page flex justify-center items-center h-full">
            <div className="flex flex-col items-center gap-5">
                <Image src="/images/emojies/frowning-face.webp" alt="404" width={100} height={100} />
                <p className="text-gray-600 text-center">{t("errorOccurred")}<br />{t("goTo")} <Link href="/settings/instagram" className="text-blue-600 hover:text-primary">{t("accounts")}</Link> {t("goToEnd")}</p>
            </div>
        </div>
    );
}   
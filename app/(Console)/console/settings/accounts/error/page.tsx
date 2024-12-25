"use client";

import { useTranslations } from "next-intl";
// Just UI Imports Below
import Image from "next/image";
import Link from "next/link";

export default function ErrorPage() {
    const t = useTranslations("Error");

    return (
        <div className="_accounts-error-page flex justify-center items-center h-full">
            <div className="flex flex-col items-center gap-5">
                <Image src="/images/emojies/frowning-face.webp" alt="404" width={100} height={100} />
                <p className="text-gray-600 text-center">متاسفانه مشکلی پیش آمده است!<br />به <Link href="/console/settings/accounts" className="text-blue-600 hover:text-primary">مدیریت اکانت‌ها</Link> بروید.</p>
            </div>
        </div>
    );
}   
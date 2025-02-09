import { Card } from "@/components/theme/ui/card";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CreditCard, PaypalLogo, Plug, Rocket } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export default function SettingsNav() {
    const t = useTranslations('Settings.Navigation');

    // تعریف مستقیم آیتم‌ها
    const items = [
        {
            title: t('accounts'),
            url: "/console/settings/accounts",
            icon: Plug,
        },
        {
            title: t('bankAccounts'),
            url: "/console/settings/cardToCard",
            icon: CreditCard,
        },
        {
            title: t('zarinpal'),
            url: "/console/settings/zarinpal",
            icon: PaypalLogo
        },
        {
            title: t('upgradePlan'),
            url: '/console/settings/upgrade',
            icon: Rocket
        }
    ];

    const pathname = usePathname()

    return (
        <Card className="h-full md:border-l-2 border-gray-100 p-6 md:p-5">
            <ul className="flex flex-col gap-2">
                {items.map((item, index) => (
                    <li key={index}>
                        <Link href={item.url} className={cn("flex items-center gap-2 p-2.5 rounded-md bg-gray-100/50 hover:bg-gray-200 duration-300 group", pathname.startsWith(item.url) && "bg-gray-200 text-black")}>
                            <item.icon size={20} className="text-gray-500 group-hover:text-black duration-300" />
                            <span className="text-[15px] text-gray-500 group-hover:text-black duration-300">{item.title}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </Card>
    );
}

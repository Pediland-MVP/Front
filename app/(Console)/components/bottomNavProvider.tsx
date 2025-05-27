'use client'
import { useSidebar } from "@/components/theme/ui/sidebar";
import { BottomNav, NavItem } from "./bottomNav";
import { DotsThree, Storefront, ShoppingBagOpen, Robot, TelegramLogo } from '@phosphor-icons/react/dist/ssr';
import { useTranslations } from "next-intl";

export function BottomNavProvider() {

    const { setOpenMobile } = useSidebar()
    
    const t = useTranslations('BottomNav')

    const items: NavItem[] = [
        {
            icon: <DotsThree/>,
            label: <p>{t('menu')}</p>,
            href: "#",
            onClick: () => setOpenMobile(true)
        },
        {
            icon: <Storefront/>,
            label: <p>{t('shop')}</p>,
            href: "/products",
        },
        {
            icon: <Robot/>,
            isMain: true,
            href: '/automations',
            label: <p>{t('automations')}</p>
        },
        {
            icon: <ShoppingBagOpen/>,
            label: <p>{t('orders')}</p>,
            href: '/orders',
        },
        {
            icon: <TelegramLogo/>,
            label: <p>{t('support')}</p>,
            href: 'https://T.me/elhamrahiimi',
            target: '_blank'
        }
    ]
    
    return (
        <BottomNav items={items} />
    )

}
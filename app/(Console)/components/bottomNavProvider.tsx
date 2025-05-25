'use client'
import { useSidebar } from "@/components/theme/ui/sidebar";
import { BottomNav, NavItem } from "./bottomNav";
import { DotsThree, Storefront, Plus, UsersThree, ShoppingBagOpen, Robot, User  } from '@phosphor-icons/react/dist/ssr'
import { useTranslations } from "next-intl";

export function BottomNavProvider() {

    const { setOpenMobile } = useSidebar()
    
    const t = useTranslations('BottomNav')

    const items: NavItem[] = [
        {
            icon: DotsThree,
            label: t('menu'),
            href: "#",
            onClick: () => setOpenMobile(true)
        },
        {
            icon: Storefront,
            label: t('shop'),
            href: "/products",
        },
        {
            icon: Robot,
            isMain: true,
            href: '/automations',
            label: t('automations')
        },
        {
            icon: ShoppingBagOpen,
            label: t('orders'),
            href: '/orders',
        },
        {
            icon: User,
            label: t('profile'),
            href: '/profile',
        }
    ]
    
    return (
        <BottomNav items={items} />
    )

}
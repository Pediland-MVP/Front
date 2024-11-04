// navLinks.ts
import {
    AddressBookTabs,
    ChatCircleText,
    HouseSimple,
    Lightning,
    Question,
    Sliders,
    Storefront,
    User,
    Wallet,
} from "@phosphor-icons/react/dist/ssr";

export const navLinks = [
    {
        title: "داشبورد",
        icon: HouseSimple,
        href: "/console",
    },
    {
        title: "ارتباطات",
        icon: AddressBookTabs,
        href: "/console/contacts",
    },
    {
        title: "صندوق پیام‌ها",
        icon: ChatCircleText,
        href: "/console/inbox",
    },
    {
        title: "اتوماسیون",
        icon: Lightning,
        href: "/console/actions",
    },
    {
        title: "محصولات",
        icon: Storefront,
        href: "/console/products",
    },
    {
        title: "مالی",
        icon: Wallet,
        href: "/console/accounts",
    },
    {
        title: "تنظیمات",
        icon: Sliders,
        href: "/console/settings",
    },
    {
        title: "مدیریت حساب‌ها",
        icon: User,
        href: "/console/accounts",
    },
    {
        title: "پشتیبانی",
        icon: Question,
        href: "/console/support",
    },
];

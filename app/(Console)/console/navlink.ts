// navLinks.ts
import {
    AddressBookTabs,
    Chat,
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
        title: "دایرکت‌ها",
        icon: ChatCircleText,
        href: "/console/inbox",
    },
    {
        title: "کامنت‌ها",
        icon: Chat,
        href: "/console/comments",
    },
    {
        title: "اتوماسیون",
        icon: Lightning,
        href: "/console/actions/content-cycle",
    },
    {
        title: "کالاها / خدمات",
        icon: Storefront,
        href: "/console/products",
    },
    {
        title: "تنظیمات",
        icon: Sliders,
        href: "/console/settings",
    },
    // {
    //     title: "پشتیبانی",
    //     icon: Question,
    //     href: "/console/support",
    // },
];

"use client";

import { useTranslations } from "next-intl";

import { NavBottom, NavItem, useSidebar } from "@/components/index";
import {
  DotsThreeOutlineIcon,
  LightningIcon,
  ShoppingBagOpenIcon,
  StorefrontIcon,
  TelegramLogoIcon,
} from "@phosphor-icons/react/dist/ssr";

export const NavBottomProvider = () => {
  const { setOpenMobile } = useSidebar();
  const t = useTranslations("BottomNav");
  const items: NavItem[] = [
    {
      icon: <DotsThreeOutlineIcon />,
      label: <p>{t("menu")}</p>,
      href: "#",
      onClick: () => setOpenMobile(true),
    },
    {
      icon: <StorefrontIcon />,
      label: <p>{t("shop")}</p>,
      href: "/products",
    },
    {
      icon: <LightningIcon />,
      isMain: true,
      href: "/automations",
      label: <p>{t("automations")}</p>,
    },
    {
      icon: <ShoppingBagOpenIcon />,
      label: <p>{t("orders")}</p>,
      href: "/orders",
    },
    {
      icon: <TelegramLogoIcon />,
      label: <p>{t("support")}</p>,
      href: "https://T.me/+989360226688",
      target: "_blank",
    },
  ];

  return <NavBottom items={items} />;
};

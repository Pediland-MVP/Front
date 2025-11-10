// src/components/layout/HeaderBreadcrumb.tsx
"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui";

// تشخیص UUID (برای سگمنت‌های داینامیک)
const isUUID = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s,
  );

// اگر بخوای چند سگمنت ثابت رو ترجمه کنی، اینجا تعریفشون کن
const knownSegmentKey = (seg: string): string | null => {
  switch (seg) {
    case "add":
      return "new";
    case "edit":
      return "edit";
    case "password":
      return "password";
    case "subscription":
      return "subscription";
    case "contacts":
      return "contacts";
    case "directs":
      return "directs";
    case "comments":
      return "comments";
    case "automations":
      return "automations";
    case "sessions":
      return "sessions";
    case "orders":
      return "orders";
    case "products":
      return "products";
    case "settings":
      return "settings";
    case "instagram":
      return "instagram";
    case "card":
      return "card";
    case "zarinpal":
      return "zarinpal";
    case "upgrade":
      return "upgrade";
    case "profile":
      return "profile";
    case "verify":
      return "verify";
    default:
      return null;
  }
};

export function HeaderBreadcrumb() {
  const pathname = usePathname();
  const t = useTranslations("Breadcrumbs");

  // سگمنت‌ها را یکبار بساز
  const segments = useMemo(
    () =>
      pathname
        .split("/")
        .filter(Boolean)
        .map((segment, index, arr) => {
          const path = `/${arr.slice(0, index + 1).join("/")}`;
          const isLast = index === arr.length - 1;
          return { segment, path, isLast };
        }),
    [pathname],
  );

  // برچسب نهایی هر سگمنت را تعیین کن
  const getLabel = (segment: string) => {
    // 1) اگر UUID/آیدی داینامیک بود
    if (isUUID(segment)) return t("detail"); // کلید ثابت: Breadcrumbs.detail

    // 2) اگر کلید شناخته‌شده داشت
    const key = knownSegmentKey(segment);
    if (key) return t(key); // مثل Breadcrumbs.automations

    // 3) در غیر این صورت: خود متن قابل‌خواندن را نشان بده (بدون ترجمه)
    return decodeURIComponent(segment);
  };

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex w-full overflow-hidden">
        {segments.map(({ segment, path, isLast }) => {
          const label = getLabel(segment);

          return (
            <React.Fragment key={path}>
              <BreadcrumbItem className={isLast ? "min-w-0 flex-1" : ""}>
                {isLast ? (
                  <span
                    className="md:text-secondary block truncate whitespace-nowrap text-white md:font-medium"
                    aria-current="page"
                  >
                    {label}
                  </span>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={path}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

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
} from "@/components/index";

export function HeaderBreadcrumb() {
  const pathname = usePathname();
  const t = useTranslations("Breadcrumbs");

  // build segments once
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

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex w-full overflow-hidden">
        {segments.map(({ segment, path, isLast }) => (
          <React.Fragment key={path}>
            <BreadcrumbItem className={isLast ? "min-w-0 flex-1" : ""}>
              {isLast ? (
                <span
                  className="block truncate whitespace-nowrap"
                  aria-current="page"
                >
                  {t(path, { default: segment })}
                </span>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={path}>{t(path, { default: segment })}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

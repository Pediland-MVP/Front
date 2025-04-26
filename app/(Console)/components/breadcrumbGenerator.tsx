"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/theme/ui/breadcrumb";

export function BreadcrumbGenerator() {
  const pathname = usePathname();

  const pathSegments = pathname.split("/").filter((segment) => segment !== "");
  const t = useTranslations("Breadcrumbs");

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex w-full overflow-hidden">
        {pathSegments.map((segment, index) => {
          const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const lastpart = pathSegments[pathSegments.length - 1];
          const withoutLastpart = pathSegments.slice(0, -1).join("/");
          

          return (
            <React.Fragment key={path}>
              <BreadcrumbItem className={isLast ? "flex-1 min-w-0" : ""}>
                {isLast ? (
                  <span className="block truncate whitespace-nowrap">
                    {path.includes('-') ? t(`/${withoutLastpart}/item`) : t(path)}
                  </span>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={path}>{t(path) || segment}</Link>
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

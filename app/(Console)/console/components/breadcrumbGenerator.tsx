"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useTranslations } from 'next-intl';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/theme/ui/breadcrumb"

export function BreadcrumbGenerator() {
    const pathname = usePathname()

    const pathSegments = pathname.split("/").filter((segment) => segment !== "")
    const t = useTranslations('Breadcrumbs');

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {pathSegments.map((segment, index) => {
                    const path = `/${pathSegments.slice(0, index + 1).join("/")}`
                    const isLast = index === pathSegments.length - 1

                    return (
                        <React.Fragment key={path}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {isLast ? (
                                    <span>{t(path) || segment}</span>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={path}>{t(path) || segment}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </React.Fragment>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}

"use client";

import { ProductNamespace } from "@/types/product";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProductFormSkeleton from "../components/product.form.skeleton";
import ProductForm from "../components/product.form";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import SidebarTrigger from "@/components/theme/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/theme/ui/breadcrumb";
import { toast } from "@/components/ui/use-toast";
import useSWRImmutable from "swr/immutable";

export default function Product({ id }: { id: string }) {
  const t = useTranslations("Products");
  const router = useRouter();

  const { data: product, error: productError } = useSWRImmutable(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/products/${id}`,
    {
      refreshInterval: 30_000,
      revalidateOnMount: true,
    }
  );

  useEffect(() => {
    if (productError)
      toast({
        title: t("notFound"),
        variant: "destructive",
      });
  }, [productError]);
  console.log(typeof product, !!product);

  if (!product) {
    return <ProductFormSkeleton />;
  }

  return (
    <div className="_edit-product">
      <header className="bg-white px-4 py-3 h-16 flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 border-b-2 border-gray-100">
        <div className="_wrap flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/console">
                  {t("dashboard")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="hidden sm:block">
                <BreadcrumbLink href="/console/products">
                  {t("title")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem className="sm:hidden">
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t("editTitle")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="_tools"></div>
      </header>

      <ProductForm shouldBeEdit={product} />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import ProductFormSkeleton from "../components/product.form.skeleton";
import ProductForm from "../components/product.form";
import { useTranslations } from "next-intl";
// Just UI Imports Below
import { toast } from "@/components/ui/use-toast";
import useSWRImmutable from "swr/immutable";
import useUser from "@/hooks/useUser";

export default function Product({ id }: { id: string }) {
  const t = useTranslations("Products");
  const { isAuthenticated } = useUser();

  const {
    data: product,
    error: productError,
    mutate: mutateProduct,
  } = useSWRImmutable(isAuthenticated ? `/products/${id}` : null, {
    refreshInterval: 30_000,
    revalidateOnMount: true,
  });

  useEffect(() => {
    if (productError)
      toast({
        title: t("notFound"),
        variant: "destructive",
      });
  }, [productError]);
  // console.log(typeof product, !!product);

  if (!product) {
    return <ProductFormSkeleton />;
  }

  return (
    <div className="_edit-product overflow-auto">
      <ProductForm shouldBeEdit={product} />
    </div>
  );
}

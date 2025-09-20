"use client";

import useUser from "@/hooks/useUser";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import useSWRImmutable from "swr/immutable";
import ProductForm from "../components/product.form";
import ProductFormSkeleton from "../components/product.form.skeleton";

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
    if (productError) toast.error(t("notFound"));
  }, [productError]);

  if (!product) {
    return <ProductFormSkeleton />;
  }

  return (
    <div className="_edit-product overflow-auto">
      <ProductForm shouldBeEdit={product} />
    </div>
  );
}

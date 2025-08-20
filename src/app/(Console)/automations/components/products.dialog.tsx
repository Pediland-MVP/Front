// app/(Console)/automations/components/products.dialog.tsx
"use client";

import { Button } from "@/components/theme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ErrorMessage from "@/components/ui/errorMessage";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/hooks/swr/api-client";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { ProductNamespace } from "@/types/product";
import { AxiosError, AxiosResponse } from "axios";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MouseEvent, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import InfiniteScroll from "react-infinite-scroll-component";
import { z } from "zod";
import { contentCycleFormSchema } from "./contentCycle";

const PAGE_SIZE = 50;

export type InstagramProductsDialogProps = {
  index: number;
  updateProducts: any;
  productsField: any;
};

const ProductsDialog = ({
  index,
  updateProducts,
  productsField,
}: InstagramProductsDialogProps) => {
  const t = useTranslations("Automations.ProductsDialog");
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<ProductNamespace.Products>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const {
    formState: { errors },
  } = useFormContext<z.infer<typeof contentCycleFormSchema>>();

  const fetchProducts = async (pageNumber: number = 1) => {
    setIsLoading(true);
    await api
      .get(`/products?page=${pageNumber}&limit=${PAGE_SIZE}`)
      .then((res: AxiosResponse<ProductNamespace.GET>) => {
        setProducts((prevProducts) => [...prevProducts, ...res.data.items]);
        setHasMore(res.data.meta.totalPages === PAGE_SIZE);
        setPage((prevPage) => prevPage + 1);
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        console.error(t("fetchError"), e);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      setProducts([]);
      setPage(1);
      fetchProducts();
    }
  }, [isOpen]);

  const selectPost = (e: MouseEvent<HTMLDivElement>) => {
    const productId = e.currentTarget.dataset.productid!;
    const url = e.currentTarget.dataset.url;

    updateProducts(index, {
      id: productId,
      images: [{ url }],
    });
    setIsOpen(false);
  };

  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden rounded-lg bg-gray-900">
        {productsField[index]?.id ? (
          <div className="relative h-[240px] w-[200px] rounded-lg">
            <Image
              src={productsField[index]?.images?.[0]?.url}
              alt={t("coverImageAlt")}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 duration-150 hover:opacity-100">
              <Button type="button" className="text-xs text-white">
                {t("changeProduct")}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button type="button" variant="link" className="text-white">
              {t("selectProduct")}
            </Button>
            {/*TODO: Check types*/}
            {(errors as any)?.products?.[index]?.id && (
              <ErrorMessage>
                {(errors as any).products?.[index].id.message}
              </ErrorMessage>
            )}
          </div>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[50rem]">
        <DialogHeader>
          <DialogTitle>{t("selectProduct")}</DialogTitle>
          <DialogDescription>{t("selectProductDescription")}</DialogDescription>
        </DialogHeader>
        <InfiniteScroll
          dataLength={products.length}
          next={() => fetchProducts(page)}
          hasMore={hasMore}
          loader={<></>}
          endMessage={<p>{t("noMorePosts")}</p>}
          scrollableTarget="scrollableDiv"
        >
          <div
            className="grid w-full grid-cols-3 gap-4"
            id="scrollableDiv"
            style={{ maxHeight: "60vh", overflowY: "auto" }}
          >
            {!products.length
              ? Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="col-span-1">
                    <Skeleton className="relative h-56 w-full" />
                  </div>
                ))
              : Array.isArray(products) &&
                products.map((product) => (
                  <div
                    className="relative col-span-1 h-56 w-full overflow-hidden rounded-sm bg-black"
                    key={product.id}
                    data-url={product?.images[0].url}
                    data-productid={product.id}
                    onClick={selectPost}
                  >
                    <Image
                      src={product?.images[0].url}
                      alt={product?.title || t("instagramPostAlt")}
                      layout="fill"
                      objectFit="cover"
                      className="duration-150 hover:opacity-80"
                    />
                    <div className="bg-opacity-50 absolute inset-x-0 bottom-0 bg-black px-2 py-1">
                      <div className="text-sm font-bold text-white">
                        {product?.title}
                      </div>
                      <div className="text-sm text-white">
                        {t("price", { price: product.price })}
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </InfiniteScroll>
        <DialogFooter className="flex items-center justify-center gap-x-2">
          <Button onClick={() => setIsOpen(false)}>{t("close")}</Button>
          <Link href="/products/add" target="_blank">
            <Button>{t("add")}</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductsDialog;

// src/components/Automations/Form/Contents/ProductContentItemDialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import InfiniteScroll from "react-infinite-scroll-component";

const PAGE_SIZE = 50;

export type ProductContentItemDialogProps = {
  index: number;
  updateProducts: any;
  productsField: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ProductContentItemDialog = ({
  index,
  updateProducts,
  productsField,
  isOpen,
  onOpenChange,
}: ProductContentItemDialogProps) => {
  const t = useTranslations("Automations.Contents.Product.Dialog");
  const [products, setProducts] = useState<ProductNamespace.Products>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

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
        console.error(t("fetch_error"), e);
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
    onOpenChange(false);
  };

  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[50rem]">
        <DialogHeader>
          <DialogTitle>{t("select_product")}</DialogTitle>
          <DialogDescription>
            {t("select_product_description")}
          </DialogDescription>
        </DialogHeader>
        <InfiniteScroll
          dataLength={products.length}
          next={() => fetchProducts(page)}
          hasMore={hasMore}
          loader={<></>}
          endMessage={
            <p className="text-muted-foreground mt-4 text-center text-sm">
              {t("no_more_posts")}
            </p>
          }
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
                      alt={product?.title || t("instagram_post_alt")}
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
          <Button onClick={() => onOpenChange(false)}>{t("close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

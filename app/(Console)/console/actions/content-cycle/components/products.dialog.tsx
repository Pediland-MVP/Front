"use client";

import { useTranslations } from 'next-intl';
import { useState, useEffect, MouseEvent } from "react";
import Image from "next/image";
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
import InfiniteScroll from "react-infinite-scroll-component";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorMessage from "@/components/ui/errorMessage";
import { ProductNamespace } from "@/types/product";
import { UseFormStateReturn } from "react-hook-form";
import { z } from "zod";
import { contentCycleFormSchema } from "./contentCycle";

const PAGE_SIZE = 9;

export type InstagramProductsDialogProps = {
  formState: UseFormStateReturn<z.infer<typeof contentCycleFormSchema>>;
  index: number;
  updateProducts: any;
  productsField: any;
};

const ProductsDialog = ({
  formState,
  index,
  updateProducts,
  productsField,
}: InstagramProductsDialogProps) => {
  const t = useTranslations('Automations.ProductsDialog');
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<ProductNamespace.Products>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProducts = async (pageNumber: number = 1) => {
    setIsLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_BACK_API_URL}/products?page=${pageNumber}&limit=${PAGE_SIZE}`;
      const response = await fetch(url, { credentials: "include" });
      const data: ProductNamespace.GET = await response.json();

      if (!response.ok) {
        console.error(t('fetchError'), response.statusText);
        return;
      }

      setProducts((prevProducts) => [...prevProducts, ...data.items]);
      setHasMore(data.meta.totalPages === PAGE_SIZE);
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error(t('fetchError'), error);
    } finally {
      setIsLoading(false);
    }
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
      images: [{url}],
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {productsField[index]?.id ? (
          <div className="relative rounded-lg overflow-hidden">
            <Image
              src={productsField[index]?.images?.[0]?.url}
              alt={t('coverImageAlt')}
              width={300}
              height={300}            
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 duration-150 flex justify-center items-center">
              <Button type="button" className="text-white text-xs">
                {t('changeProduct')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center w-full gap-y-2">
            <Button type="button" variant="outline" className='text-xs'>{t('selectProduct')}</Button>
            {formState?.errors?.products?.[index]?.id && (
              <ErrorMessage>
                {formState.errors.products?.[index].id.message}
              </ErrorMessage>
            )}
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[50rem]">
        <DialogHeader>
          <DialogTitle>{t('selectProduct')}</DialogTitle>
          <DialogDescription>{t('selectProductDescription')}</DialogDescription>
        </DialogHeader>
        <InfiniteScroll
          dataLength={products.length}
          next={() => fetchProducts(page)}
          hasMore={hasMore}
          loader={<></>}
          endMessage={<p>{t('noMorePosts')}</p>}
          scrollableTarget="scrollableDiv"
        >
          <div
            className="w-full grid grid-cols-3 gap-4"
            id="scrollableDiv"
            style={{ maxHeight: "60vh", overflowY: "auto" }}
          >
            {!products.length
              ? Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="col-span-1">
                    <Skeleton className="relative w-full h-56" />
                  </div>
                ))
              : Array.isArray(products) &&
                products.map((product) => (
                  <div
                    className="relative w-full h-56 col-span-1 bg-black rounded-sm overflow-hidden"
                    key={product.id}
                    data-url={product.images[0].url}
                    data-productid={product.id}
                    onClick={selectPost}
                  >
                    <Image
                      src={product.images[0].url}
                      alt={product.title || t('instagramPostAlt')}
                      layout="fill"
                      objectFit="cover"
                      className="hover:opacity-80 duration-150"
                    />
                    <div className="absolute inset-x-0 bottom-0 px-2 py-1 bg-black bg-opacity-50">
                      <div className="text-white text-sm font-bold">{product.title}</div>
                      <div className="text-white text-sm">{t('price', { price: product.price })}</div>
                    </div>
                  </div>
                ))}
          </div>
        </InfiniteScroll>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>{t('close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductsDialog;


"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ProductNamespace } from "@/types/product";
import useDebounce from "@/hooks/useDebounce";
import { fetcher } from "@/hooks/swr/fetcher";
import EditProduct from "./product.dialog";
import { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { ProductDeleteDialog } from "./product.delete";
import { cn } from "@/lib/utils";
import ProductListSkeleton from "./productListSkeleton";

// Just UI Imports Below
import { Card } from "@/components/theme/ui/card";
import { Button } from "@/components/theme/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/theme/ui/table";
import { toast } from "@/components/ui/use-toast";
import {
  CaretRight,
  CaretLeft,
  Pencil,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import { CardToCardNamespace } from "@/types/cardToCard";
import { ExceptionMessage } from '../../../../../types/exceptionMessage';
import { ERROR_CODES } from "@/app/constants/errorCodes.constant";
import CardToCardAlert from "./cardToCard.alert";
import { PaymentNamespace } from "@/types/payments/payment.namespace";


interface ContentItem {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  image: string;
}

export default function ProductListTable() {
  const t = useTranslations("Products.List");
  const [limit, setLimit] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState("");
  const debouncedSearchTerm = useDebounce(search, 500);
  const [open, setOpen] = useState<boolean>(false);
  const [productId, setProductId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const {
    data: productsData,
    error: productsError,
    isLoading: isProductsLoading,
    mutate: fetchproducts,
  } = useSWR<ProductNamespace.GET>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL
    }/products?page=${page}&limit=${limit}${search ? `&search=${debouncedSearchTerm}` : ""
    }`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );
  const products = productsData?.items || [];
  const productsMeta = productsData?.meta || undefined;

  const router = useRouter();


  // If products === 0 we check if user need add payment method
  // If user have not payment method we show warning
  const [isCheckUserPaymentMethodLoading, setIsCheckUserPaymentMethodLoading] = useState(true)
  const [isUserNeedAddPaymentMethod, setIsUserNeedAddPaymentMethod] = useState(false)

  useEffect(() => {
    if (productsData) {
      if (productsData.items.length > 0) {
        setIsCheckUserPaymentMethodLoading(false)
        return 
      }
      if (productsData.items.length === 0) {
        fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/payments/methods`, {
          credentials: 'include'
        })
        .then(async res => {
          if (!res.ok) {
            const json: ExceptionMessage = await res.json()
            if (json.code === 'PAYMENT_METHODS_NOT_FOUND') {
              setIsUserNeedAddPaymentMethod(true)
            }
            return
          }

          const result = await res.json() as PaymentNamespace.GET.PaymentMethods
          if (!result.cardToCard && !result.zarinpal) {
            setIsUserNeedAddPaymentMethod(true)
          }

        })
        .catch(() => setIsCheckUserPaymentMethodLoading(true))
      }
    }
  }, [productsData])

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACK_API_URL}/products/${itemToDelete}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (!res.ok) {
          toast({
            title: t("error"),
            description: t("problemOccurred"),
            variant: "destructive",
          });
          return;
        }

        toast({
          title: t("deleted"),
        });
        await mutate(
          (key) => typeof key === "string" && key.includes("products")
        );
      } catch (error) {
        console.error("Error deleting item:", error);
      } finally {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      }
    }
  };
  const locale = useLocale();

  if (isUserNeedAddPaymentMethod) {
      return (
        <CardToCardAlert/>
      ) 
  }

  return (
    <Card className="border-b-2 border-gray-100">
      <EditProduct productId={productId} open={open} setOpen={setOpen} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="lg:w-[7%] text-center">{t("image")}</TableHead>
            <TableHead className={cn(locale === "fa" ? "text-right" : "text-left")}>{t("title")}</TableHead>
            <TableHead className="text-center">{t("type")}</TableHead>
            <TableHead className="text-center">{t("price")}</TableHead>
            <TableHead className="text-center">{t("quantity")}</TableHead>
            <TableHead className="text-center">{t("creationDate")}</TableHead>
            <TableHead className="text-center">{t("status")}</TableHead>
            <TableHead className="text-center lg:w-[7%]">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>

        {isProductsLoading || isCheckUserPaymentMethodLoading ? (
          <ProductListSkeleton />
        ) : (
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="flex justify-center">
                  <Image
                    src={product.images?.[0]?.url}
                    alt={product.title}
                    width={50}
                    height={50}
                    className="rounded-sm"
                  />
                </TableCell>

                <TableCell>{product.title}</TableCell>

                <TableCell className="text-center">کالای فیزیکی</TableCell>

                <TableCell className="text-center">
                  {product.price.toLocaleString()}
                </TableCell>

                <TableCell className="text-center">
                  {product.quantity}
                </TableCell>

                <TableCell className="text-center">
                  {new DateObject(product.createDate)
                    .setCalendar(persian)
                    .setLocale(persian_fa)
                    .format("YYYY/MM/DD")}
                </TableCell>

                <TableCell className="text-center">
                  فعال
                </TableCell>

                <TableCell>
                  <div className="flex gap-2 justify-center">
                    <Pencil
                      size={20}
                      weight="light"
                      className="text-gray-500 hover:text-green-600 cursor-pointer"
                      onClick={() => {
                        router.push(`/console/products/${product.id}`);
                      }}
                    />
                    <Trash
                      size={20}
                      weight="light"
                      className="text-gray-500 hover:text-red-600 cursor-pointer"
                      onClick={() => handleDeleteClick(product.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>

      <div className="flex justify-between items-center mt-4">
        <Button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          variant={'ghost'}
        >
          {locale === "fa" ? <CaretRight size={18} /> : <CaretLeft size={18} />}
          {t("previous")}
        </Button>
        <span className="text-muted-foreground text-sm">
          {t("pageOf", { current: page, total: productsMeta?.totalPages })}
        </span>
        <Button
          onClick={() =>
            setPage((prev) => Math.min(prev + 1, productsMeta?.totalPages || 1))
          }
          disabled={page === productsMeta?.totalPages}
          variant={'ghost'}
        >
          {t("next")}
          {locale === "fa" ? <CaretLeft size={18} /> : <CaretRight size={18} />}
        </Button>
      </div>

      <ProductDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemId={itemToDelete || ""}
      />
    </Card>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ProductNamespace } from "@/types/product";
import { useDebounce } from "@/hooks/useDebounce";
import EditProduct from "./product.dialog";
import { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { ProductDeleteDialog } from "./product.delete";
import { cn } from "@befroosh/lib";
import ProductListSkeleton from "./productListSkeleton";

// Just UI Imports Below
import { Card } from "@befroosh/ui";
import { Button } from "@befroosh/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@befroosh/ui";
import { toast } from "sonner";
import {
  CaretRightIcon,
  CaretLeftIcon,
  PencilIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ExceptionMessage } from "@/types/exceptionMessage";
import CardToCardAlert from "./cardToCard.alert";
import useSWRImmutable from "swr/immutable";
import api from "@/hooks/swr/api-client";
import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";
import { AxiosError } from "axios";

interface ContentItem {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  image: string;
}

export default function ProductListTable() {
  const t = useTranslations("Products.List");
  const t_ec = useTranslations("ERROR_CODES");
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
  } = useSWRImmutable<ProductNamespace.GET>(
    `/products?page=${page}&limit=${limit}${
      search ? `&search=${debouncedSearchTerm}` : ""
    }`,
    {
      revalidateOnMount: true,
    },
  );
  const products = productsData?.items || [];
  const productsMeta = productsData?.meta || undefined;

  const router = useRouter();

  const [isUserNeedAddPaymentMethod, setIsUserNeedAddPaymentMethod] =
    useState(false);

  const shouldCheckPaymentMethod: boolean = Boolean(
    productsData && productsData.items.length === 0,
  );

  const {
    data: paymentMethods,
    error: paymentMethodsError,
    isLoading: isPaymentMethodsLoading,
  } = useSWR(`/payments/methods`, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!paymentMethods) return;
    if (!paymentMethods.cardToCard && !paymentMethods.zarinpal) {
      setIsUserNeedAddPaymentMethod(true);
    }
  }, [paymentMethods]);

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
      await api
        .delete(`/products/${itemToDelete}`)
        .then((res) => {
          toast(t("deleted"));
          mutate(mutateIncludeStringKey("products"));
        })
        .catch((e: AxiosError<ExceptionMessage>) => {
          const code = e.response?.data?.code;
          if (code === "PRODUCT_IS_IN_AUTOMATION") {
            e.response?.data.data?.contentCycles?.forEach((cc: any) => {
              toast.error(t_ec(code), {
                description: t("productInAutomation", {
                  automationTitle: cc?.title,
                }),
              });
            });
            return;
          }
          toast.error(t_ec(code));
        })
        .finally(() => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        });
    }
  };
  const locale = useLocale();

  if (isUserNeedAddPaymentMethod) {
    return <CardToCardAlert />;
  }

  return (
    <Card className="border-b-2 border-gray-100">
      <EditProduct productId={productId} open={open} setOpen={setOpen} />
      <div className="_table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("image")}</TableHead>
              <TableHead
                className={cn(locale === "fa" ? "text-right" : "text-left")}
              >
                {t("title")}
              </TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("price")}</TableHead>
              <TableHead>{t("quantity")}</TableHead>
              <TableHead>{t("creationDate")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>

          {isProductsLoading || isPaymentMethodsLoading ? (
            <ProductListSkeleton />
          ) : (
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Image
                      src={product.images?.[0]?.url}
                      alt={product?.title}
                      width={50}
                      height={50}
                      className="rounded-sm"
                    />
                  </TableCell>

                  <TableCell>{product?.title}</TableCell>

                  <TableCell>
                    {product.isDigital
                      ? t("digitalProduct")
                      : t("regularProduct")}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`${typeof product?.discountPrice === "number" ? "line-through" : ""}`}
                    >
                      {product.price.toLocaleString()}
                    </span>
                    <br />
                    {typeof product.discountPrice === "number" && (
                      <span>{product.discountPrice?.toLocaleString()}</span>
                    )}
                  </TableCell>

                  <TableCell>{product.quantity}</TableCell>

                  <TableCell>
                    {new DateObject(product.createDate)
                      .setCalendar(persian)
                      .setLocale(persian_fa)
                      .format("YYYY/MM/DD")}
                  </TableCell>

                  <TableCell>فعال</TableCell>

                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <PencilIcon
                        size={20}
                        weight="light"
                        className="cursor-pointer hover:text-green-600"
                        onClick={() => {
                          router.push(`/products/${product.id}`);
                        }}
                      />
                      <TrashIcon
                        size={20}
                        weight="light"
                        className="cursor-pointer hover:text-red-600"
                        onClick={() => handleDeleteClick(product.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          variant={"ghost"}
          size={"sm"}
        >
          {locale === "fa" ? <CaretRightIcon /> : <CaretLeftIcon />}
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
          variant={"ghost"}
          size={"sm"}
        >
          {t("next")}
          {locale === "fa" ? <CaretLeftIcon /> : <CaretRightIcon />}
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

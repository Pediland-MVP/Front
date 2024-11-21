"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

import { toast } from "@/components/ui/use-toast";
import {
  CaretRight,
  CaretLeft,
  Pencil,
  Trash,
} from "@phosphor-icons/react/dist/ssr";

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
    `${
      process.env.NEXT_PUBLIC_BACK_API_URL
    }/products?page=${page}&limit=${limit}${
      search ? `&search=${debouncedSearchTerm}` : ""
    }`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );
  const products = productsData?.items || [];
  const productsMeta = productsData?.meta || undefined;

  const router = useRouter();

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

  return (
    <div className="_table bg-stone-50 p-4 border rounded-lg shadow">
      <EditProduct productId={productId} open={open} setOpen={setOpen} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">{t("image")}</TableHead>
            <TableHead className="text-right">{t("title")}</TableHead>
            <TableHead className="text-right">{t("price")}</TableHead>
            <TableHead className="text-right">{t("creationDate")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Image
                  src={product.images?.[0]?.url}
                  alt={product.title}
                  width={50}
                  height={50}
                  className="rounded-sm"
                />
              </TableCell>
              <TableCell>{product.title}</TableCell>
              <TableCell>{product.price.toLocaleString()}</TableCell>
              <TableCell>
                {new DateObject(product.createDate)
                  .setCalendar(persian)
                  .setLocale(persian_fa)
                  .format("YYYY/MM/DD")}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      router.push(`/console/products/${product.id}`);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(product.id)}
                  >
                    <Trash className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-between items-center mt-4">
        <Button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          <CaretRight className="h-4 w-4 ml-2" />
          {t("previous")}
        </Button>
        <span>
          {t("pageOf", { current: page, total: productsMeta?.totalPages })}
        </span>
        <Button
          onClick={() =>
            setPage((prev) => Math.min(prev + 1, productsMeta?.totalPages || 1))
          }
          disabled={page === productsMeta?.totalPages}
        >
          {t('next')}
          <CaretLeft className="h-4 w-4 mr-2" />
        </Button>
      </div>
      <ProductDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemId={itemToDelete || ""}
      />
    </div>
  );
}

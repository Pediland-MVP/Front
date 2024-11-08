"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Pencil, Trash2 } from "lucide-react";
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
// import * as DateObject from 'date-fns-jalali'
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { ProductDeleteDialog } from "./product.delete";
import { toast } from "@/components/ui/use-toast";

interface ContentItem {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  image: string;
}

export default function ProductListTable() {
  const [limit, setLimit] = useState<number>(10);
  // const [contacts, setContacts] = useState<ContactNamespace.Contacts>([]);
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
    },
  );
  const products = productsData?.items || [];
  const productsMeta = productsData?.meta || undefined;

  const handleEdit = (item: ContentItem) => {
    // setEditingItem({ ...item })
  };

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
          },
        );

        if (!res.ok) {
          toast({
            title: "خطا",
            description: "مشکلی پیش آمده است",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "حذف شد",
        });
        await mutate(
          (key) => typeof key === "string" && key.includes("products"),
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
    <div className="_table p-4 rounded-xl shadow bg-white">
      <EditProduct productId={productId} open={open} setOpen={setOpen} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">تصویر</TableHead>
            <TableHead className="text-right">عنوان</TableHead>
            <TableHead className="text-right">قیمت</TableHead>
            <TableHead className="text-right">تاریخ ایجاد</TableHead>
            <TableHead className="text-right">اقدامات</TableHead>
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
                    <Trash2 className="h-4 w-4 ml-2" />
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
          <ChevronRight className="h-4 w-4 ml-2" />
          قبلی
        </Button>
        <span>
          صفحه {page} از {productsMeta?.totalPages}
        </span>
        <Button
          onClick={() =>
            setPage((prev) => Math.min(prev + 1, productsMeta?.totalPages || 1))
          }
          disabled={page === productsMeta?.totalPages}
        >
          بعدی
          <ChevronLeft className="h-4 w-4 mr-2" />
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

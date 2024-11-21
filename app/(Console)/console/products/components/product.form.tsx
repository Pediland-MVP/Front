"use client";

import { useTranslations } from 'next-intl';
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { FileUpload } from "@/components/file-upload";
import axios from "axios";
import { UploadNamespace } from "@/types/upload";
import { useRouter } from "next/navigation";
import LoadingButton from "@/components/ui/button-loading";
import { ProductNamespace } from "@/types/product";
import { mutate } from "swr";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const formSchema = z
  .object({
    title: z
      .string({
        message: "لطفا عنوان کالا یا خدمات خود را وارد کنید.",
      })
      .min(1, {
        message: "لطفا عنوان کالا یا خدمات خود را وارد کنید.",
      }),
    status: z.boolean(),
    price: z
      .number({
        message: "قیمت نمی‌تواند کمتر از صفر باشد.",
      })
      .min(0, {
        message: "قیمت نمی‌تواند کمتر از صفر باشد.",
      }),
    isInfinite: z.boolean(),
    quantity: z.number().optional(),
    description: z
      .string({
        message: "توضیحات باید حداقل 5 کاراکتر باشد.",
      })
      .min(5, {
        message: "توضیحات باید حداقل 5 کاراکتر باشد.",
      }),
    imageId: z
      .number({ message: "تصویر محصول را آپلود کنید" })
      .min(1, "تصویر محصول را آپلود کنید"),
    isDigital: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.isInfinite && !data.quantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "تعداد نمیتواند کمتر از صفر باشد",
        path: ["quantity"],
        fatal: true,
      });
      return z.NEVER;
    }
  });

export type ProductFormProps = {
  shouldBeEdit?: ProductNamespace.Product;
};

export default function ProductForm({ shouldBeEdit }: ProductFormProps) {
  const t = useTranslations('Products.Form');
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isDigital: false,
      status: true,
      isInfinite: false,
      ...shouldBeEdit,
      imageId: shouldBeEdit?.images?.[0].id || undefined,
    },
  });

  useEffect(() => {
    if (form.formState?.errors?.imageId) {
      toast({
        title: t('uploadProductImage'),
        variant: "destructive",
      });
    }
  }, [form.formState.errors]);

  const router = useRouter();

  const [isLoading, setLoading] = useState(false);
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!values.isInfinite && !values.quantity) {
      form.setError("quantity", {
        message: t('quantityError'),
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/products${
          shouldBeEdit ? `/${shouldBeEdit.id}` : ""
        }`,
        {
          method: shouldBeEdit ? "PUT" : "POST",
          body: JSON.stringify(values),
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        toast({
          title: t('errorOccurred'),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t('productAddedSuccess'),
      });

      await mutate(
        (key) => typeof key === "string" && key.includes("products")
      );
      router.push("/console/products");
    } catch (error) {
      toast({
        title: t('checkConnection'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<string[]>(
    shouldBeEdit?.images?.[0].url ? [shouldBeEdit?.images?.[0].url] : []
  );
  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true);
    const file = files[0];
    const formData = new FormData();
    formData.append("image", file);

    const controller = new AbortController();
    const signal = controller.signal;

    try {
      const response = await axios.post<UploadNamespace.POST["Image"]>(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/upload/image`,
        formData,
        {
          signal,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              console.log(`Upload Progress: ${percentCompleted}%`);
              setUploadProgress(percentCompleted);
            } else {
              console.log(`Loaded ${progressEvent.loaded} bytes`);
            }
          },
          withCredentials: true,
        }
      );
      form.setValue("imageId", response.data.id);
      setImages([response.data.url]);
    } catch (error) {
      console.error(error);
    } finally {
      setUploadProgress(0);
      setIsUploading(false);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white flex flex-col md:flex-row gap-8">
      <div className="flex-1 p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('productTitle')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <div className="flex gap-2 items-center">
                  <Switch
                    dir="ltr"
                    id="status"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                  <Label htmlFor="direct">{t('inactive')}</Label>
                </div>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('price')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="۰.۰۰"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('quantity')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="۰.۰۰"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                      disabled={form.getValues().isInfinite}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Controller
              name="isInfinite"
              control={form.control}
              render={({ field }) => (
                <div className="flex gap-2 items-center">
                  <Switch
                    dir="ltr"
                    id="isinfinite"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                  <Label htmlFor="direct">{t('unlimitedQuantity')}</Label>
                </div>
              )}
            />
            <Controller
              name="isDigital"
              control={form.control}
              render={({ field }) => (
                <div className="flex gap-2 items-center">
                  <Switch
                    dir="ltr"
                    id="direct"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                  <Label htmlFor="direct">{t('physicalProduct')}</Label>
                </div>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('describeProduct')}
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LoadingButton isLoading={isLoading} type="submit">
              {t('submitProduct')}
            </LoadingButton>
          </form>
        </Form>
      </div>
      <div className="flex-1 p-6">
        <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
          <FileUpload
            images={images}
            accept="image/*"
            onChange={handleFileUpload}
            progress={uploadProgress}
            isUploading={isUploading}
          />
        </div>
      </div>
    </div>
  );
}


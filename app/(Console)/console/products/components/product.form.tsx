"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { UploadNamespace } from "@/types/upload";
import { useRouter } from "next/navigation";
import { ProductNamespace } from "@/types/product";
import { mutate } from "swr";
import { Input } from "@/components/theme/ui/input";
import { Textarea } from "@/components/theme/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { FileUpload } from "@/components/file-upload";
import LoadingButton from "@/components/ui/button-loading";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/theme/ui/card";

export type ProductFormProps = {
  shouldBeEdit?: ProductNamespace.Product;
};

export default function ProductForm({ shouldBeEdit }: ProductFormProps) {
  const t = useTranslations("Products.Form");
  const formSchema = z
    .object({
      title: z
        .string({
          message: t("Alerts.title"),
        })
        .min(1, {
          message: t("Alerts.titleLenght"),
        }),
      status: z.boolean(),
      price: z.union([z.number().int().positive(), z.nan()]),
      discountPrice: z
        .union([z.number().int().positive(), z.nan()])
        .optional()
        .nullable(),
      isDiscount: z.boolean().default(false),
      // .transform((data) => data || undefined),
      // .transform((data) => data || undefined),
      isInfinite: z.boolean(),
      quantity: z.number().positive().optional(),
      description: z
        .string({
          message: t("Alerts.description"),
        })
        .min(5, {
          message: t("Alerts.descrptionLength"),
        }),
      imageId: z
        .number({
          message: t("Alerts.image"),
        })
        .min(1, t("Alerts.image")),
      isDigital: z.boolean(),
    })
    .superRefine((data, ctx) => {
      // if (!data.isInfinite && (!data.quantity || data.quantity <= 0)) {
      //   console.log("Adding issue for quantity");
      //   ctx.addIssue({
      //     code: z.ZodIssueCode.custom,
      //     message: "وقتی تعداد نامحدود نیست، تعداد نمی‌تواند خالی یا صفر باشد.",
      //     path: ["quantity"],
      //   });
      // }

      if (data.isDiscount && !data.discountPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "وقتی کالا تخفیف دارد، قیمت تخفیف نمی‌تواند خالی باشد.",
          path: ["discountPrice"],
        });
      }

      if (data.price! < 1000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "قیمت کالا نمی‌تواند کمتر از 1000 تومان باشد.",
          path: ["price"],
        });
      }

      if (data.discountPrice) {
        if (data.discountPrice > data.price!) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "قیمت تخفیف نمی‌تواند بیشتر از قیمت کالا باشد.",
            path: ["discountPrice"],
          });
        }

        if (data.discountPrice < 1000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "قیمت تخفیف نمی‌تواند کمتر از 1000 تومان باشد.",
            path: ["discountPrice"],
          });
        }

        if (data.discountPrice === data.price) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "قیمت تخفیف نمی‌تواند برابر با قیمت کالا باشد.",
            path: ["discountPrice"],
          });
        }
      }
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isDigital: false,
      status: true,
      isInfinite: false,
      ...(shouldBeEdit || {}), // اطمینان از مقدار پیش‌فرض
      imageId: shouldBeEdit?.images?.[0]?.id || undefined,
      isDiscount: !!shouldBeEdit?.discountPrice,
      discountPrice: shouldBeEdit?.discountPrice || undefined,
    },
  });

  useEffect(() => {
    if (form.formState?.errors?.imageId) {
      toast({
        title: t("uploadProductImage"),
        variant: "destructive",
      });
    }
    console.log("Form errors:", form.formState.errors);
  }, [form.formState.errors.imageId]);

  const router = useRouter();

  const [isLoading, setLoading] = useState(false);
  async function onSubmit(values: z.infer<typeof formSchema>) {

    //TODO: Move to superRefine
    if (!values.isInfinite && (typeof values.quantity == 'undefined' || values.quantity == null)) {
      form.setError("quantity", {
        message: t("quantityError"),
      });
      return;
    }

    if (!values.discountPrice || !values.isDiscount) {
      values.discountPrice = null;
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
          title: t("errorOccurred"),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t("productAddedSuccess"),
      });

      await mutate(
        (key) => typeof key === "string" && key.includes("products")
      );
      router.push("/console/products");
    } catch (error) {
      toast({
        title: t("checkConnection"),
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
    <div className="w-full xl:w-1/2 2xl:w-1/3">
      <Card className="border-l-2 border-gray-100 px-8 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("productTitle")} {...field} />
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
                  <Label htmlFor="direct">{t("active")}</Label>
                  <Switch
                    dir="ltr"
                    id="status"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                  <Label htmlFor="direct">{t("inactive")}</Label>
                </div>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("price")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="۰.۰۰"
                      {...field}
                      onChange={(e) => field.onChange(+e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDiscount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("activateDiscount")}</FormLabel>
                  <FormControl>
                    <Switch
                      dir="ltr"
                      id="isinfinite"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked)}
                      type="button"
                      className="mx-2"
                    />
                  </FormControl>
                  <FormMessage />
                  {field.value && (
                    <FormField
                      control={form.control}
                      name="discountPrice"
                      render={({ field }) => (
                        <FormItem>
                          {/* <FormLabel>{t("discountPrice")}</FormLabel> */}
                          <FormControl>
                            <Input
                              placeholder="۰.۰۰"
                              {...field}
                              value={field.value || 0}
                              onChange={(e) =>
                                field.onChange(+(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </FormItem>
              )}
            />

            <Controller
              name="isInfinite"
              control={form.control}
              render={({ field }) => (
                <div className="flex gap-2 items-center">
                  <Label htmlFor="direct">{t("unlimitedQuantity")}</Label>
                  <Switch
                    dir="ltr"
                    id="isinfinite"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                  <Label htmlFor="direct">{t("limitedQuantity")}</Label>
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("quantity")}</FormLabel>
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
              name="isDigital"
              control={form.control}
              render={({ field }) => (
                <div className="flex gap-2 items-center">
                  <Label htmlFor="direct">{t("digitalService")}</Label>
                  <Switch
                    dir="ltr"
                    id="direct"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                  <Label htmlFor="direct">{t("physicalProduct")}</Label>
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("describeProduct")}
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>{t("uploadImage")}</FormLabel>
              <FileUpload
                images={images}
                accept="image/*"
                onChange={handleFileUpload}
                progress={uploadProgress}
                isUploading={isUploading}
              />
            </div>

            <LoadingButton isLoading={isLoading} type="submit">
              {t("submitProduct")}
            </LoadingButton>
          </form>
        </Form>
      </Card>
    </div>
  );
}

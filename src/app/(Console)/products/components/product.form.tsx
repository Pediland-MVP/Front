"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import api from "@/hooks/swr/api-client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadNamespace } from "@/types/upload";
import { AttributeValue, ProductItem, ProductNamespace } from "@/types/product";
import { onInputP2EHandler } from "@/utils/p2eNumber";

// UI Components from shadcn and custom theme
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui-custom/use-toast";
import { FileUpload } from "@/components/file-upload";
import LoadingButton from "@/components/ui/button-loading";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import MultipleSelector from "@/components/ui/multi-selector";
import useSWRImmutable from "swr/immutable";
import { ProductVariationNamespace } from "@/types/variations/productAttribute.namespace";
import { ProductFieldTypeEnum } from "@/types/product.enum";
import { ProductFields } from "./productFields";
import { FormDescription } from "@/components/ui/form";
import { useSelectOnFocus } from "@/hooks/useSelectOnFocus";
import { ShippingCost } from "./shippingCost";

export type ProductFormProps = {
  shouldBeEdit?: ProductNamespace.Product;
};

export default function ProductForm({ shouldBeEdit }: ProductFormProps) {
  const t = useTranslations("Products.Form");
  const t_ec = useTranslations("ERROR_CODES");
  const router = useRouter();

  const {
    data: variations,
    isLoading: isVariationsLoading,
    error: variationsError,
  } = useSWRImmutable<ProductVariationNamespace.GET.ProductAttributes>(
    `/variations/attributes?page=1&limit=100`,
  );
  const {
    data: attributeValues,
    isLoading: isAttributeValuesLoading,
    error: attributeValuesError,
  } = useSWRImmutable<ProductVariationNamespace.GET.ProductAttributeValues>(
    `/variations/attributeValues?page=1&limit=100`,
  );

  // TODO: Dynamic
  const colorAttribute =
    variations?.items?.find((vari) => vari.title === "رنگ") ?? null;
  const sizeAttribute =
    variations?.items?.find((vari) => vari.title === "اندازه") ?? null;

  // تعریف اسکیما با استفاده از zod
  const formSchema = z
    .object({
      status: z.boolean(),
      title: z
        .string({ message: t("Alerts.title") })
        .min(1, { message: t("Alerts.titleLenght") }),
      isInfinite: z.boolean(),
      quantity: z.number().nonnegative().optional(),
      price: z.union([z.number().int().nonnegative(), z.nan()]),
      shippingCost: z.union([z.number().int().nonnegative(), z.nan()]),
      isDiscount: z.boolean().default(false),
      discountPrice: z
        .union([z.number().int().nonnegative(), z.nan()])
        .optional()
        .nullable(),
      description: z
        .string({ message: t("Alerts.description") })
        .min(5, { message: t("Alerts.descrptionLength") }),
      imageId: z
        .number({ message: t("Alerts.image") })
        .min(1, t("Alerts.image")),
      isDigital: z.boolean(),
      haveColor: z.boolean().nullable(),
      haveSize: z.boolean().nullable(),
      sizes: z
        .array(
          z.object({
            id: z.number(),
            createDate: z.string(),
            updateDate: z.string(),
            value: z.string(),
            label: z.string(),
            colorHex: z.string().nullable(),
            attributeId: z.number(),
          }),
        )
        .optional(),
      colors: z
        .array(
          z.object({
            id: z.number(),
            createDate: z.string(),
            updateDate: z.string(),
            value: z.string(),
            label: z.string(),
            colorHex: z.string().nullable().optional(),
            attributeId: z.number(),
          }),
        )
        .optional(),
      // Just used in submit
      attributeValueIds: z.array(z.number()),
      fields: z
        .array(
          z.object({
            label: z.string().min(1),
            type: z.nativeEnum(ProductFieldTypeEnum),
            isRequired: z.boolean(),
            _xid: z.string().uuid().optional(),
            id: z.string().uuid().optional(),
          }),
        )
        .nullable()
        .optional(),
      orderButtonText: z.string().nullable().optional(),
      orderProcessText: z.string().max(1000).nullable().optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.isDiscount &&
        (data.discountPrice === undefined || data.discountPrice === null)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "وقتی کالا تخفیف دارد، قیمت تخفیف نمی‌تواند خالی باشد.",
          path: ["discountPrice"],
        });
      }
      if (data.price < 1000 && data.price !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "قیمت کالا نمی‌تواند کمتر از ۱۰۰۰ تومان باشد. باید یا ۰ و یا بزرگتر از ۱۰۰۰ تومان باشد",
          path: ["price"],
        });
      }

      if (data.shippingCost < 1000 && data.shippingCost !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("shippingCost.errors.under1000"),
          path: ["shippingCost"],
        });
      }

      if (data.discountPrice && data.isDiscount) {
        if (data.discountPrice >= data.price) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "قیمت تخفیف نمی‌تواند بیشتر یا مساوی قیمت کالا باشد.",
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
      }
    });

  // مقداردهی اولیه فرم با در نظر گرفتن حالت ایجاد یا ویرایش
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: true,
      title: "",
      isInfinite: false,
      quantity: 0,
      price: 0,
      shippingCost: 0,
      description: "",
      imageId: shouldBeEdit?.images?.[0]?.id || undefined,
      isDigital: false,
      haveColor: false,
      haveSize: false,
      colors: [],
      sizes: [],
      attributeValueIds: [],
      isDiscount:
        typeof shouldBeEdit?.discountPrice === "number"
          ? shouldBeEdit.discountPrice >= 0
            ? true
            : false
          : false,
      discountPrice:
        typeof shouldBeEdit?.discountPrice === "number"
          ? shouldBeEdit.discountPrice >= 0
            ? shouldBeEdit?.discountPrice
            : undefined
          : undefined,
      ...(shouldBeEdit || {}),
      orderButtonText: shouldBeEdit?.orderButtonText || "سفارش",
      orderProcessText:
        shouldBeEdit?.orderProcessText ||
        `#نام پرداخت شما باموفقیت انجام شد. \nمبلغ: #قیمت\nکد تراکنش: #شناسه`,
    },
  });

  const fields = form.getValues("fields");

  const [isInitilized, setIsInitilized] = useState(false);
  useEffect(() => {
    if (
      !shouldBeEdit ||
      colorAttribute === null ||
      sizeAttribute === null ||
      isInitilized
    )
      return;

    if (shouldBeEdit.fields?.length) {
      const fieldsWith_xid = shouldBeEdit.fields.map((f) => {
        f._xid = f.id;
        return f;
      });
      form.setValue("fields", fieldsWith_xid);
    }

    if (sizeAttribute) {
      if (!shouldBeEdit.productVariations?.length) return;
      const sizes: AttributeValue[] = [];
      shouldBeEdit.productVariations.forEach((variation) => {
        variation.attributes.forEach((attribute) => {
          if (attribute.id === sizeAttribute.id) {
            attribute.attributeValues.forEach((value) => {
              sizes.push(value);
            });
          }
        });
      });
      form.setValue("sizes", sizes);
      if (sizes.length > 0) {
        form.setValue("haveSize", true);
      }
    }

    if (colorAttribute) {
      if (!shouldBeEdit.productVariations?.length) return;
      const colors: AttributeValue[] = [];
      shouldBeEdit.productVariations.forEach((variation) => {
        variation.attributes.forEach((attribute) => {
          if (attribute.id === colorAttribute.id) {
            attribute.attributeValues.forEach((value) => {
              colors.push(value);
            });
          }
        });
      });
      form.setValue("colors", colors);
      if (colors.length > 0) {
        form.setValue("haveColor", true);
      }
    }

    setIsInitilized(true);
  }, [shouldBeEdit, colorAttribute, sizeAttribute]);
  // نظارت بر تغییر فیلد "type" برای نمایش عنوان صحیح
  const isDigital = form.watch("isDigital");

  // نمایش توست در صورت بروز خطای imageId
  useEffect(() => {
    if (form.formState.errors.imageId) {
      toast({
        title: t("uploadProductImage"),
        variant: "destructive",
      });
    }
    // console.log("Form errors:", form.formState.errors);
  }, [form.formState.errors.imageId]);

  const [isLoading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<string[]>(
    shouldBeEdit?.images?.[0]?.url ? [shouldBeEdit.images[0].url] : [],
  );

  // تابع ارسال فرم
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (
      values.isInfinite &&
      (values.quantity === undefined || values.quantity === null)
    ) {
      form.setError("quantity", { message: t("stockError") });
      return;
    }

    if (!values.isDiscount) {
      values.discountPrice = null;
    }

    if (values.sizes?.length && values.haveSize) {
      values.attributeValueIds = [
        ...values.attributeValueIds,
        ...values.sizes
          .filter((vari) => vari.attributeId === sizeAttribute?.id)
          .map((size) => size.id),
      ];
    }

    if (values.colors?.length && values.haveColor) {
      values.attributeValueIds = [
        ...values.attributeValueIds,
        ...values.colors
          .filter((vari) => vari.attributeId === colorAttribute?.id)
          .map((color) => color.id),
      ];
    }

    setLoading(true);
    try {
      await api({
        method: shouldBeEdit ? "PUT" : "POST",
        url: `/products${shouldBeEdit ? `/${shouldBeEdit.id}` : ""}`,
        data: values,
      });
      toast({ title: t("productAddedSuccess") });
      await mutate(
        (key) => typeof key === "string" && key.includes("products"),
      );
      router.push("/products");
    } catch (e: any) {
      toast({
        title: t_ec(e.response?.data.code),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // تابع آپلود فایل
  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true);
    const file = files[0];
    const formData = new FormData();
    formData.append("image", file);
    const controller = new AbortController();

    try {
      const response = await api.post<UploadNamespace.POST["Image"]>(
        `/upload/image`,
        formData,
        {
          signal: controller.signal,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              // console.log(`Upload Progress: ${percentCompleted}%`);
              setUploadProgress(percentCompleted);
            } else {
              console.log(`Loaded ${progressEvent.loaded} bytes`);
            }
          },
          withCredentials: true,
        },
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

  const addCustomField = () => {
    // console.log("Fields", fields);

    if (fields?.length === undefined || fields.length === null) return;
    if (fields!.length < 5) {
      form.setValue("fields", [
        ...fields,
        {
          isRequired: false,
          label: "",
          type: ProductFieldTypeEnum.TEXT,
        },
      ]);
    }
  };

  // حذف فیلد بر اساس شناسه
  const removeCustomField = (label: string) => {
    if (fields?.length === undefined || fields.length === null) return;
    form.setValue(
      "fields",
      fields.filter((field) => field.label !== label),
    );
  };

  // useEffect(() => {
  //   console.log(form.getValues());
  // }, [form.watch()]);

  useEffect(() => {
    if (form.formState.errors) {
      console.log("Errors", form.formState.errors);
    }
  }, [form.formState.errors]);

  const onHaveSizeChanged = (isChecked: boolean) => {
    form.setValue("sizes", []);
    form.setValue("haveSize", isChecked);
  };

  const onHaveColorChanged = (isChecked: boolean) => {
    form.setValue("colors", []);
    form.setValue("haveColor", isChecked);
  };

  const { onFocus } = useSelectOnFocus();

  return (
    <Card className="h-full p-4 xl:p-5">
      <div className="mb-6">
        <h2 className="text-foreground mb-1 font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-10">
            <div className="_right-column space-y-4 xl:space-y-5">
              {/* Item Details */}
              <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 xl:p-5">
                {/* Item Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormLabel className="min-w-[88px] xl:min-w-[80px]">
                        {t("status")}
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="status-active">{t("active")}</Label>
                          <Switch
                            id="status-active"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label htmlFor="status-inactive">
                            {t("inactive")}
                          </Label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Item Type */}
                <FormField
                  name="isDigital"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="mb-4 flex items-center gap-2 space-y-0 xl:gap-3">
                      <FormLabel className="min-w-[88px] xl:min-w-[80px]">
                        {t("typeItem")}
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(val) =>
                            val === "true"
                              ? field.onChange(true)
                              : field.onChange(false)
                          }
                          value={field.value?.toString()}
                          className="flex h-7 items-center"
                        >
                          <FormItem className="flex items-center gap-1.5 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="false" />
                            </FormControl>
                            <Label>{t("physicalProduct")}</Label>
                          </FormItem>
                          <FormItem className="flex items-center gap-1.5 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="true" />
                            </FormControl>
                            <Label>{t("digitalService")}</Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Item Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 xl:gap-3">
                      <FormLabel className="min-w-[88px] xl:min-w-[80px]">
                        {isDigital ? t("titleService") : t("titleProduct")}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Item Stock */}
                <FormField
                  name="isInfinite"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="mb-4 flex items-center gap-2 space-y-0 xl:gap-3">
                      <FormLabel className="min-w-[88px] xl:min-w-[80px]">
                        {t("stock")}
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) =>
                            field.onChange(value === "true")
                          }
                          value={`${field.value}`}
                          className="flex h-7 items-center"
                        >
                          <FormItem className="flex items-center gap-1.5 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="true" />
                            </FormControl>
                            <Label>{t("unlimited")}</Label>
                          </FormItem>
                          <FormItem className="flex items-center gap-1.5 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="false" />
                            </FormControl>
                            <Label>{t("limited")}</Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                      {field.value === false && (
                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem className="flex-1 space-y-0">
                              <FormControl>
                                <Input
                                  onInput={onInputP2EHandler}
                                  placeholder="۰"
                                  onFocus={onFocus}
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
                      )}
                    </FormItem>
                  )}
                />

                {/* Item Price */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 xl:gap-3">
                      <FormLabel className="min-w-[88px] xl:min-w-[80px]">
                        {t("price")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          onInput={onInputP2EHandler}
                          placeholder="۰"
                          {...field}
                          onFocus={onFocus}
                          onChange={(e) => field.onChange(+e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Item Discount */}
                <FormField
                  control={form.control}
                  name="isDiscount"
                  render={({ field }) => (
                    <FormItem className="flex flex-wrap items-center justify-start gap-2 space-y-0 xl:flex-nowrap xl:gap-3">
                      <FormLabel className="min-w-[88px] xl:min-w-[80px]">
                        {t("activateDiscount")}
                      </FormLabel>
                      <FormControl>
                        <Switch
                          id="isDiscount"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          type="button"
                        />
                      </FormControl>
                      <FormMessage />
                      {field.value && (
                        <FormField
                          control={form.control}
                          name="discountPrice"
                          render={({ field }) => (
                            <FormItem className="flex w-full items-center gap-2 space-y-0 xl:gap-3">
                              <FormLabel className="min-w-[88px] xl:min-w-fit">
                                {t("discountPrice")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  onInput={onInputP2EHandler}
                                  placeholder="۰"
                                  {...field}
                                  value={
                                    field.value == null || field.value === 0
                                      ? ""
                                      : field.value
                                  }
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    field.onChange(
                                      newValue === "" ? 0 : +newValue,
                                    );
                                  }}
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

                {/* Item Color Variants */}
                <FormField
                  control={form.control}
                  name="haveColor"
                  render={({ field }) => (
                    <FormItem className="flex flex-wrap items-center justify-start gap-2 space-y-0 xl:flex-nowrap xl:gap-3">
                      <FormLabel className="min-w-[88px] xl:min-w-[80px]">
                        {t("activateColor")}
                      </FormLabel>
                      <FormControl>
                        <Switch
                          id="haveColor"
                          checked={!!field.value}
                          onCheckedChange={onHaveColorChanged}
                          type="button"
                        />
                      </FormControl>
                      <FormMessage />
                      {field.value && (
                        <FormField
                          control={form.control}
                          name="colors"
                          render={({ field }) => (
                            <FormItem className="flex w-full items-center gap-2 space-y-0 xl:gap-3">
                              <FormControl>
                                <MultipleSelector
                                  {...field}
                                  //@ts-ignore
                                  defaultOptions={attributeValues?.items.filter(
                                    (vv) =>
                                      vv.attributeId == colorAttribute?.id,
                                  )}
                                  placeholder={t("selectColor")}
                                  emptyIndicator={
                                    <p className="text-center text-gray-600 dark:text-gray-400">
                                      موردی یافت نشد
                                    </p>
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

                <FormField
                  control={form.control}
                  name="haveSize"
                  render={({ field }) => (
                    <FormItem className="flex flex-wrap items-center justify-start gap-2 space-y-0 xl:flex-nowrap xl:gap-3">
                      <FormLabel className="min-w-[88px] xl:min-w-[80px]">
                        {t("activateSize")}
                      </FormLabel>
                      <FormControl>
                        <Switch
                          id="isSize"
                          checked={!!field.value}
                          onCheckedChange={onHaveSizeChanged}
                          type="button"
                        />
                      </FormControl>
                      <FormMessage />
                      {field.value && (
                        <FormField
                          control={form.control}
                          name="sizes"
                          render={({ field }) => (
                            <FormItem className="flex w-full items-center gap-2 space-y-0 xl:gap-3">
                              <FormControl>
                                <MultipleSelector
                                  {...field}
                                  defaultOptions={attributeValues?.items.filter(
                                    (vv) => vv.attributeId == sizeAttribute?.id,
                                  )}
                                  placeholder={t("selectSize")}
                                  emptyIndicator={
                                    <p className="text-center text-gray-600 dark:text-gray-400">
                                      موردی یافت نشد
                                    </p>
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

                {/* Item Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("descriptionLabel")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("descriptionPlaceHolder")}
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orderButtonText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orderButtonText.label")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("orderButtonText.placeholder")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("orderButtonText.description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orderProcessText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orderProcessText.label")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("orderProcessText.placeholder")}
                          {...field}
                          value={field.value || ""}
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("orderProcessText.description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <ProductFields />

              <ShippingCost />
            </div>
            <div className="_left-column space-y-4 xl:space-y-5">
              {/* Item Images */}
              <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 xl:p-5">
                <FormLabel>{t("uploadImage")}</FormLabel>
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

          {/* Submit */}
          <div className="xl:col-span-2">
            <LoadingButton isLoading={isLoading} type="submit">
              {t("submitProduct")}
            </LoadingButton>
          </div>
        </form>
      </Form>
    </Card>
  );
}

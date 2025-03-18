"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import api from "@/hooks/swr/api-client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadNamespace } from "@/types/upload";
import { ProductItem, ProductNamespace } from "@/types/product";
import { onInputP2EHandler } from "@/app/utils/p2eNumber";

// UI Components from shadcn and custom theme
import { RadioGroup, RadioGroupItem } from "@/components/theme/ui/radio-group";
import { Input } from "@/components/theme/ui/input";
import { Textarea } from "@/components/theme/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/theme/ui/form";
import { toast } from "@/components/ui/use-toast";
import { FileUpload } from "@/components/file-upload";
import LoadingButton from "@/components/ui/button-loading";
import { Switch } from "@/components/theme/ui/switch";
import { Label } from "@/components/theme/ui/label";
import { Card } from "@/components/theme/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/theme/ui/select";
import MultipleSelector, { Option } from "@/components/theme/ui/multi-selector";
import React from "react";
import { Button } from "@/components/theme/ui/button";
import {
  ArrowsVertical,
  PlusCircle,
  TrashSimple,
} from "@phosphor-icons/react/dist/ssr";
import useSWRImmutable from "swr/immutable";
import { ProductVariationNamespace } from "@/types/variations/productVariation.namespace";
import colors from "react-multi-date-picker/plugins/colors";

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
  } = useSWRImmutable<ProductVariationNamespace.GET.ProductVariationTypes>(
    `/variations/variationTypes?page=1&limit=100`
  );
  const {
    data: variationValues,
    isLoading: isVariationValuesLoading,
    error: variationValuesError,
  } = useSWRImmutable<ProductVariationNamespace.GET.ProductVariationValues>(
    `/variations/variationValues?page=1&limit=100`
  );

  // TODO: Dynamic
  const colorVariationType = variations?.items?.find(
    (vari) => vari.title === "رنگ"
  );
  const sizeVariationType = variations?.items?.find(
    (vari) => vari.title === "اندازه"
  );

  // تعریف اسکیما با استفاده از zod
  const formSchema = z
    .object({
      status: z.boolean(),
      type: z.string(),
      title: z
        .string({ message: t("Alerts.title") })
        .min(1, { message: t("Alerts.titleLenght") }),
      isInfinite: z.boolean(),
      quantity: z.number().nonnegative().optional(),
      price: z.union([z.number().int().nonnegative(), z.nan()]),
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
            variationTypeId: z.number(),
          })
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
            colorHex: z.string().nullable(),
            variationTypeId: z.number(),
          })
        )
        .optional(),
      // Just used in final
      variationValueIds: z.array(z.number()),
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
      type: "product",
      title: "",
      isInfinite: false,
      quantity: 0,
      price: 0,
      description: "",
      imageId: shouldBeEdit?.images?.[0]?.id || undefined,
      isDigital: false,
      haveColor: false,
      haveSize: false,
      colors: [],
      sizes: [],
      variationValueIds: [],
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
    },
  });

  useEffect(() => {
    if (!shouldBeEdit) return;

    if (sizeVariationType) {
      if (!shouldBeEdit.productVariations?.length) return;
      const sizes: NonNullable<ProductItem["productVariations"]>[0]["variationValues"][0][] = [];
      shouldBeEdit.productVariations.map((productVariation) => {
        productVariation.variationValues.forEach((variationValue) => {
          if (variationValue.variationTypeId == sizeVariationType?.id) {
            sizes.push(variationValue);
          }
        });
      });
      form.setValue("sizes", sizes);
      if (sizes.length > 0) {
        form.setValue("haveSize", true);
      }
    }

    if (colorVariationType) {
      if (!shouldBeEdit.productVariations?.length) return;
      const colors: NonNullable<ProductItem["productVariations"]>[0]["variationValues"][0][] = [];
      productVariations: shouldBeEdit.productVariations.map(
        (productVariation) => {
          variationValues: productVariation.variationValues.forEach(
            (variationValue) => {
              if (variationValue.variationTypeId == colorVariationType?.id) {
                colors.push(variationValue);
              }
            }
          );
        }
      );
      form.setValue("colors", colors);
      if (colors.length > 0) {
        form.setValue("haveColor", true);
      }
    }
  }, [shouldBeEdit, colorVariationType, sizeVariationType]);
  // نظارت بر تغییر فیلد "type" برای نمایش عنوان صحیح
  const selectedType = useWatch({ control: form.control, name: "type" });

  // نمایش توست در صورت بروز خطای imageId
  useEffect(() => {
    if (form.formState.errors.imageId) {
      toast({
        title: t("uploadProductImage"),
        variant: "destructive",
      });
    }
    console.log("Form errors:", form.formState.errors);
  }, [form.formState.errors.imageId]);

  const [isLoading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState<string[]>(
    shouldBeEdit?.images?.[0]?.url ? [shouldBeEdit.images[0].url] : []
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
      values.variationValueIds = [...values.variationValueIds, ...values.sizes.filter(vari => vari.variationTypeId === sizeVariationType?.id).map((size) => size.id)];
    }

    if (values.colors?.length && values.haveColor) {
      values.variationValueIds = [...values.variationValueIds, ...values.colors.filter(vari => vari.variationTypeId === colorVariationType?.id).map((color) => color.id)];
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
        (key) => typeof key === "string" && key.includes("products")
      );
      router.push("/console/products");
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

  // const OPTIONS: Option[] = [
  //   { label: "قرمز", value: "red" },
  //   { label: "آبی", value: "blue" },
  //   { label: "سبز", value: "green" },
  //   { label: "زرد", value: "yellow" },
  //   { label: "صورتی", value: "pink" },
  //   { label: "بنفش", value: "purple" },
  //   { label: "نارنجی", value: "orange" },
  //   { label: "سیاه", value: "black" },
  //   { label: "سفید", value: "white" },
  //   { label: "خاکستری", value: "gray" },
  //   { label: "قهوه‌ای", value: "brown" },
  //   { label: "فیروزه‌ای", value: "turquoise" },
  //   { label: "سرمه‌ای", value: "navy" },
  //   { label: "آبی روشن", value: "skyblue" },
  //   { label: "سبز تیره", value: "darkgreen" },
  // ];

  // const [value, setValue] = React.useState<Option[]>([]);

  // const [customFields, setCustomFields] = useState<{ id: number }[]>([]);

  // // افزودن فیلد جدید (حداکثر ۵ فیلد)
  // const addCustomField = () => {
  //   if (customFields.length < 5) {
  //     setCustomFields([...customFields, { id: Date.now() }]);
  //   }
  // };

  // // حذف فیلد بر اساس شناسه
  // const removeCustomField = (id: number) => {
  //   setCustomFields(customFields.filter((field) => field.id !== id));
  // };

  useEffect(() => {
    console.log(form.getValues());
  }, [form.watch()]);

  useEffect(() => {
    if (form.formState.errors) {
      console.log("Errors", form.formState.errors);
    }
  }, [form.formState.errors]);

  return (
    <Card className="h-full p-4 xl:p-5">
      <div className="mb-6">
        <h2 className="font-semibold text-foreground mb-1">{t("title")}</h2>
        <p className="text-[15px] text-muted-foreground">{t("description")}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-10">
            <div className="_right-column space-y-4 xl:space-y-5">
              {/* Item Details */}
              <div className="space-y-3 bg-blue-50/50 rounded-xl border border-blue-100 p-3 xl:p-5">
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
                        <div className="flex gap-2 items-center">
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
                  name="type"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 xl:gap-3 mb-4 space-y-0">
                      <FormLabel className="min-w-[88px] xl:min-w-[80px]">
                        {t("typeItem")}
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex items-center h-7"
                        >
                          <FormItem className="flex items-center gap-1.5 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="product" />
                            </FormControl>
                            <Label>{t("physicalProduct")}</Label>
                          </FormItem>
                          <FormItem className="flex items-center gap-1.5 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="service" />
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
                    <FormItem className="flex items-center gap-2 xl:gap-3 space-y-0">
                      <FormLabel className="min-w-[88px] xl:min-w-[80px]">
                        {selectedType === "product"
                          ? t("titleProduct")
                          : selectedType === "service"
                            ? t("titleService")
                            : t("titleNull")}
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
                    <FormItem className="flex items-center gap-2 xl:gap-3 mb-4 space-y-0">
                      <FormLabel className="min-w-[88px] xl:min-w-[80px]">
                        {t("stock")}
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) =>
                            field.onChange(value === "true")
                          }
                          value={`${field.value}`}
                          className="flex items-center h-7"
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
                            <FormItem className="space-y-0 flex-1">
                              <FormControl>
                                <Input
                                  onInput={onInputP2EHandler}
                                  placeholder="۰"
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
                    <FormItem className="flex items-center gap-2 xl:gap-3 space-y-0">
                      <FormLabel className="min-w-[88px] xl:min-w-[80px]">
                        {t("price")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          onInput={onInputP2EHandler}
                          placeholder="۰"
                          {...field}
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
                    <FormItem className="flex flex-wrap xl:flex-nowrap items-center justify-start gap-2 xl:gap-3 space-y-0">
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
                            <FormItem className="flex items-center gap-2 xl:gap-3 space-y-0 w-full">
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
                                      newValue === "" ? 0 : +newValue
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
                    <FormItem className="flex flex-wrap xl:flex-nowrap items-center justify-start gap-2 xl:gap-3 space-y-0">
                      <FormLabel className="min-w-[88px] xl:min-w-[80px]">
                        {t("activateColor")}
                      </FormLabel>
                      <FormControl>
                        <Switch
                          id="haveColor"
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                          type="button"
                        />
                      </FormControl>
                      <FormMessage />
                      {field.value && (
                        <FormField
                          control={form.control}
                          name="colors"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 xl:gap-3 space-y-0 w-full">
                              <FormControl>
                                <MultipleSelector
                                  {...field}
                                  //@ts-ignore
                                  defaultOptions={variationValues?.items.filter(
                                    (vv) =>
                                      vv.variationTypeId ==
                                      colorVariationType?.id
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
                    <FormItem className="flex flex-wrap xl:flex-nowrap items-center justify-start gap-2 xl:gap-3 space-y-0">
                      <FormLabel className="min-w-[88px] xl:min-w-[80px]">
                        {t("activateSize")}
                      </FormLabel>
                      <FormControl>
                        <Switch
                          id="isSize"
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                          type="button"
                        />
                      </FormControl>
                      <FormMessage />
                      {field.value && (
                        <FormField
                          control={form.control}
                          name="sizes"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 xl:gap-3 space-y-0 w-full">
                              <FormControl>
                                <MultipleSelector
                                  {...field}
                                  defaultOptions={variationValues?.items.filter(
                                    (vv) =>
                                      vv.variationTypeId ==
                                      sizeVariationType?.id
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
              </div>

              {/* <div className="space-y-3 bg-blue-50/50 rounded-xl border border-blue-100 p-3 xl:p-5">
                <FormLabel>{t("customFields")}</FormLabel>
                <p className="text-muted-foreground text-[13px]">
                  {t("customFieldsDescription")}
                </p>
                <div className="space-y-3">
                  <Button
                    type="button" // جلوگیری از ارسال فرم
                    size={"sm"}
                    variant={"outline"}
                    onClick={addCustomField}
                    disabled={customFields.length >= 5}
                  >
                    {t("addCustomField")}
                    <PlusCircle />
                  </Button>
                  <div className="_custom-fields space-y-2">
                    {customFields.map((field) => (
                      <div
                        key={field.id}
                        className="_item flex items-center gap-1.5"
                      >
                        <span>
                          <ArrowsVertical size={16} className="text-gray-500" />
                        </span>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="نوع فیلد" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="inputBox">
                                متن کوتاه
                              </SelectItem>
                              <SelectItem value="textArea">متن بلند</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="عنوان فیلد"
                          value=""
                          className="w-[160px]"
                        />
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="وضعیت" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="optional">اختیاری</SelectItem>
                              <SelectItem value="required">اجباری</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button" // جلوگیری از ارسال فرم
                          variant="ghost"
                          size={"icon"}
                          onClick={() => removeCustomField(field.id)}
                        >
                          <TrashSimple size={20} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div> */}
            </div>
            <div className="_left-column space-y-4 xl:space-y-5">
              {/* Item Images */}
              <div className="space-y-3 bg-blue-50/50 rounded-xl border border-blue-100 p-3 xl:p-5">
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

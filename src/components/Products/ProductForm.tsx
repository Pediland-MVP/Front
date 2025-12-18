"use client";

import api from "@/hooks/swr/api-client";
import { AttributeValue, ProductNamespace } from "@/types/product";
import { ButtonTypeEnum } from "@/types/buttons.enum";
import { ProductFieldTypeEnum } from "@/types/product.enum";
import { UploadNamespace } from "@/types/upload";
import { ProductVariationNamespace } from "@/types/variations/productAttribute.namespace";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { mutate } from "swr";
import useSWRImmutable from "swr/immutable";
import * as z from "zod";

// UI Components from shadcn and custom theme
import { FormCustomFields } from "@/components/Products/FormCustomFields";
import { FormProductDetails } from "@/components/Products/FormProductDetails";
import { FormShippingCost } from "@/components/Products/FormShippingCost";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
} from "@/components/ui";
import { ButtonLoading } from "@/components/ui-custom/ButtonLoading";
import { FileUploader } from "@/components/ui-custom/FileUploader";
import { FormVitrinDetails } from "./FormVitrinDetails";
import { FormVitrinButtons } from "./FormVitrinButtons";

interface ProductFormProps {
  shouldBeEdit?: ProductNamespace.Product;
  type: "p" | "v";
}

export default function ProductForm({ shouldBeEdit, type }: ProductFormProps) {
  const t = useTranslations("Products.Form");
  const t_ec = useTranslations("ERROR_CODES");
  const router = useRouter();

  const formType = type === "p" ? "Product" : "Vitrin";

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

  // تعریف اسکیما با استفاده از zod
  const formSchema = z
    .object({
      // Common fields for both Product and Vitrin
      status: z.boolean(),
      title: z
        .string()
        .min(1, {
          message: t("Alerts.title", {
            product: formType === "Product" ? t("product") : t("vitrin"),
          }),
        })
        .min(3, {
          message: t("Alerts.title_length", {
            product: formType === "Product" ? t("product") : t("vitrin"),
          }),
        }),
      description: z
        .string()
        .min(1, {
          message: t("Alerts.description", {
            product: formType === "Product" ? t("product") : t("vitrin"),
          }),
        })
        .min(5, {
          message: t("Alerts.descrption_length", {
            product: formType === "Product" ? t("product") : t("vitrin"),
          }),
        }),
      imageId: z
        .number({
          message: t("Alerts.image", {
            product: formType === "Product" ? t("product") : t("vitrin"),
          }),
        })
        .min(1, {
          message: t("Alerts.image", {
            product: formType === "Product" ? t("product") : t("vitrin"),
          }),
        }),
      // Product-specific fields
      ...(formType === "Product"
        ? {
            isInfinite: z.boolean(),
            quantity: z.number().nonnegative().optional(),
            price: z.union([z.number().int().nonnegative(), z.nan()]),
            shippingCost: z.union([z.number().int().nonnegative(), z.nan()]),
            isDiscount: z.boolean().default(false),
            discountPrice: z
              .union([z.number().int().nonnegative(), z.nan()])
              .optional()
              .nullable(),
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
            orderButtonText: z.string().nullable().optional(),
            orderProcessText: z.string().max(1000).nullable().optional(),
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
          }
        : {}),

      // Vitrin-specific fields
      ...(formType === "Vitrin"
        ? {
            buttons: z
              .array(
                z.discriminatedUnion("postbackPayloadType", [
                  z.object({
                    _xid: z.string().optional(),
                    postbackPayloadType: z.literal(ButtonTypeEnum.TEXT),
                    title: z
                      .string()
                      .min(1, { message: t("Alerts.button_title_required") }),
                    url: z.string().optional().nullable(),
                    destinationContentCycleId: z.string().optional().nullable(),
                  }),
                  z.object({
                    _xid: z.string().optional(),
                    postbackPayloadType: z.literal(ButtonTypeEnum.URL),
                    title: z
                      .string()
                      .min(1, { message: t("Alerts.button_title_required") }),
                    url: z
                      .string({
                        required_error: t("Alerts.button_url_required"),
                      })
                      .min(1, { message: t("Alerts.button_url_required") }),
                    destinationContentCycleId: z.string().optional().nullable(),
                  }),
                  z.object({
                    _xid: z.string().optional(),
                    postbackPayloadType: z.literal(
                      ButtonTypeEnum.START_AUTOMATION,
                    ),
                    title: z
                      .string()
                      .min(1, { message: t("Alerts.button_title_required") }),
                    url: z.string().optional().nullable(),
                    destinationContentCycleId: z
                      .string({
                        required_error: t("Alerts.button_automation_required"),
                      })
                      .min(1, {
                        message: t("Alerts.button_automation_required"),
                      }),
                  }),
                ]),
              )
              .min(1, { message: t("Alerts.buttons") }),
          }
        : {}),
    })
    .superRefine((data, ctx) => {
      if (
        data.isDiscount &&
        (data.discountPrice === undefined || data.discountPrice === null)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "قیمت با تخفیف را وارد کنید.",
          path: ["discountPrice"],
        });
      }
      if (data.price < 1000 && data.price !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "قیمت کالا می‌تواند ۰ و یا بزرگتر از ۱۰۰۰ تومان باشد.",
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
  // Helper function to infer button type from API data
  const inferButtonType = (button: any): ButtonTypeEnum => {
    // Check for contentCycleId/cycleId first (AUTOMATION)
    if (
      button.destinationContentCycleId ||
      button.cycleId ||
      button.contentCycle?.id ||
      button.cycle?.id
    ) {
      return ButtonTypeEnum.START_AUTOMATION;
    }
    // Check for URL
    if (button.url && button.url !== null && button.url !== "") {
      return ButtonTypeEnum.URL;
    }
    // Default to TEXT
    return ButtonTypeEnum.TEXT;
  };

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
      isDigital: false,
      haveColor: false,
      haveSize: false,
      colors: [],
      sizes: [],
      attributeValueIds: [],
      ...(shouldBeEdit
        ? {
            ...shouldBeEdit,
            imageId: shouldBeEdit?.images?.[0]?.id || undefined,
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
            // Override buttons with properly mapped version
            buttons: shouldBeEdit?.buttons?.map((b: any) => ({
              ...b,
              postbackPayloadType:
                b.postbackPayloadType || b.type || inferButtonType(b),
              _xid: typeof b.id !== "undefined" ? String(b.id) : undefined,
              destinationContentCycleId:
                b.cycleId ||
                b.destinationContentCycleId ||
                b.contentCycle?.id ||
                b.cycle?.id ||
                "",
              // Preserve the destinationContentCycle object for display
              destinationContentCycle:
                b.destinationContentCycle || b.contentCycle || b.cycle,
              url: b.url || "",
              title: b.title || "",
            })),
            shippingCost: shouldBeEdit?.shippingCost ?? 0,
            orderButtonText: shouldBeEdit?.orderButtonText || "سفارش",
            orderProcessText:
              shouldBeEdit?.orderProcessText ||
              `#نام پرداخت شما باموفقیت انجام شد. \\nمبلغ: #قیمت\\nکد تراکنش: #شناسه`,
          }
        : {
            imageId: undefined,
            isDiscount: false,
            discountPrice: undefined,
            buttons:
              formType === "Vitrin"
                ? [
                    {
                      postbackPayloadType: ButtonTypeEnum.TEXT,
                      title: "",
                      url: "",
                      destinationContentCycleId: null,
                    },
                  ]
                : [],
            orderButtonText: "سفارش",
            orderProcessText: `#نام پرداخت شما باموفقیت انجام شد. \\nمبلغ: #قیمت\\nکد تراکنش: #شناسه`,
          }),
    },
  });

  const fields = form.getValues("fields");

  const [isLoading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isInitilized, setIsInitilized] = useState(false);
  const [images, setImages] = useState<string[]>(
    shouldBeEdit?.images?.[0]?.url ? [shouldBeEdit.images[0].url] : [],
  );

  // TODO: Dynamic
  const colorAttribute =
    variations?.items?.find((vari) => vari.title === "رنگ") ?? null;
  const sizeAttribute =
    variations?.items?.find((vari) => vari.title === "اندازه") ?? null;

  useEffect(() => {
    if (shouldBeEdit?.images?.[0]?.url) {
      const imageUrl = shouldBeEdit.images[0].url;
      setImages([imageUrl]);
    }
  }, [shouldBeEdit]);

  useEffect(() => {
    if (!shouldBeEdit || formType !== "Vitrin") return;

    if (shouldBeEdit.buttons?.length) {
      const mappedButtons = shouldBeEdit.buttons.map((b: any) => ({
        ...b,
        postbackPayloadType:
          b.postbackPayloadType || b.type || inferButtonType(b),
        _xid: typeof b.id !== "undefined" ? String(b.id) : undefined,
        destinationContentCycleId:
          b.cycleId ||
          b.destinationContentCycleId ||
          b.contentCycle?.id ||
          b.cycle?.id ||
          "",
        // Preserve the destinationContentCycle object for display
        destinationContentCycle:
          b.destinationContentCycle || b.contentCycle || b.cycle,
        url: b.url || "",
        title: b.title || "",
      }));
      form.setValue("buttons", mappedButtons);
    }
  }, [shouldBeEdit, formType]);

  useEffect(() => {
    if (
      !shouldBeEdit ||
      formType !== "Product" ||
      colorAttribute === null ||
      sizeAttribute === null ||
      isInitilized
    )
      return;

    if (shouldBeEdit.fields?.length) {
      const fieldsWith_xid = shouldBeEdit.fields.map((f) => {
        f["_xid"] = f.id;
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
  }, [shouldBeEdit, colorAttribute, sizeAttribute, formType, isInitilized]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (formType === "Product") {
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
    }

    if (formType === "Product") {
      delete (values as any).buttons;
    }

    if (formType === "Vitrin") {
      delete (values as any).orderButtonText;
      delete (values as any).orderProcessText;
      delete (values as any).status;

      if ((values as any).buttons?.length) {
        (values as any).buttons.forEach((button: any) => {
          if (
            button.postbackPayloadType === ButtonTypeEnum.TEXT ||
            button.postbackPayloadType === ButtonTypeEnum.START_AUTOMATION
          ) {
            delete button.url;
          }

          if (
            button.postbackPayloadType === ButtonTypeEnum.TEXT ||
            button.postbackPayloadType === ButtonTypeEnum.URL
          ) {
            delete button.destinationContentCycleId;
          }
        });
      }
    }

    setLoading(true);

    try {
      if (formType === "Product") {
        await api({
          method: shouldBeEdit ? "PUT" : "POST",
          url: `/products${shouldBeEdit ? `/${shouldBeEdit.id}` : ""}`,
          data: values,
        });
        toast.success(
          shouldBeEdit ? t("productEditedSuccess") : t("productAddedSuccess"),
        );
        await mutate(
          (key) => typeof key === "string" && key.includes("products"),
        );
      }

      if (formType === "Vitrin") {
        await api({
          method: shouldBeEdit ? "PUT" : "POST",
          url: `/vitrin${shouldBeEdit ? `/${shouldBeEdit.id}` : ""}`,
          data: values,
        });
        toast.success(
          shouldBeEdit ? t("vitrinEditedSuccess") : t("vitrinAddedSuccess"),
        );
        await mutate(
          (key) => typeof key === "string" && key.includes("vitrin"),
        );
      }

      router.push("/products");
    } catch (e: any) {
      if (e.code === "ERR_BAD_REQUEST") {
        toast.error(t_ec("ERR_BAD_REQUEST"));
      } else {
        toast.error(t_ec(e.response?.data.code));
      }
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
              setUploadProgress(percentCompleted);
            } else {
              console.log(`Loaded ${progressEvent.loaded} bytes`);
            }
          },
          withCredentials: true,
        },
      );
      form.setValue("imageId", response.data.id, { shouldValidate: true });
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

  return (
    <>
      <div className="mb-4 space-y-1">
        <h2 className="text-foreground font-semibold">
          {t("add")} {formType === "Product" ? t("product") : t("vitrin")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("description", {
            product: formType === "Product" ? t("product") : t("vitrin"),
          })}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-5">
            <div className="_right-column space-y-4">
              {formType === "Product" ? (
                <>
                  <FormProductDetails
                    variations={variations}
                    attributeValues={attributeValues}
                  />

                  <FormCustomFields />

                  <FormShippingCost />
                </>
              ) : (
                <>
                  <FormVitrinDetails />

                  <FormVitrinButtons />
                </>
              )}
            </div>

            <div className="_left-column space-y-4 xl:space-y-5">
              {/* Item Images */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("upload_image")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <FileUploader
                    images={images}
                    accept="image/*"
                    onChange={handleFileUpload}
                    progress={uploadProgress}
                    isUploading={isUploading}
                  />
                  {form.formState.errors.imageId && (
                    <p className="text-destructive text-[13px] font-medium">
                      {form.formState.errors.imageId.message as string}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex gap-2">
            <ButtonLoading
              isLoading={isLoading}
              type="submit"
              className="flex-1 sm:flex-none"
            >
              {shouldBeEdit ? t("edit") : t("submit")}{" "}
              {formType === "Product" ? t("product") : t("vitrin")}
            </ButtonLoading>
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push("/products")}
              className="flex-1 sm:flex-none"
            >
              {t("cancel")}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}

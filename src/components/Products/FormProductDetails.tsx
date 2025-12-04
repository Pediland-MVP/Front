"use client";

import {
  Card,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Textarea,
} from "@/components/ui";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { onInputP2EHandler } from "@/utils/p2eNumber";
import { formatNumber } from "@/utils/formatNumber";
import MultipleSelector, { Option } from "@/components/ui/multi-selector";
import { useSelectOnFocus } from "@/hooks/useSelectOnFocus";
import { useEffect, useState } from "react";
import { ProductVariationNamespace } from "@/types/variations/productAttribute.namespace";

interface FormProductDetailsProps {
  variations?: ProductVariationNamespace.GET.ProductAttributes;
  attributeValues?: ProductVariationNamespace.GET.ProductAttributeValues;
}

export const FormProductDetails = ({
  variations,
  attributeValues,
}: FormProductDetailsProps) => {
  const form = useFormContext();
  const t = useTranslations("Products.Form");
  const { onFocus } = useSelectOnFocus();

  const isDigital = form.watch("isDigital");

  const onHaveSizeChanged = (isChecked: boolean) => {
    form.setValue("sizes", []);
    form.setValue("haveSize", isChecked);
  };

  const onHaveColorChanged = (isChecked: boolean) => {
    form.setValue("colors", []);
    form.setValue("haveColor", isChecked);
  };

  // TODO: Dynamic
  const colorAttribute =
    variations?.items?.find((vari) => vari.title === "رنگ") ?? null;
  const sizeAttribute =
    variations?.items?.find((vari) => vari.title === "اندازه") ?? null;

  return (
    <Card className="gap-3 p-3 xl:p-5">
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
                <Label htmlFor="status-inactive">{t("inactive")}</Label>
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
          <FormItem className="flex items-center gap-2 space-y-0 xl:gap-3">
            <FormLabel className="min-w-[88px] xl:min-w-[80px]">
              {t("typeItem")}
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(val) =>
                  val === "true" ? field.onChange(true) : field.onChange(false)
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
          <FormItem className="flex items-center gap-2 space-y-0 xl:gap-3">
            <FormLabel className="min-w-[88px] xl:min-w-[80px]">
              {t("stock")}
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(value) => field.onChange(value === "true")}
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
                value={formatNumber(field.value)}
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
                            : formatNumber(field.value)
                        }
                        onChange={(e) => {
                          const newValue = e.target.value;
                          field.onChange(newValue === "" ? 0 : +newValue);
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
                        value={(field.value || []) as Option[]}
                        onChange={(options) => field.onChange(options as any)}
                        //@ts-ignore
                        defaultOptions={attributeValues?.items.filter(
                          (vv) => vv.attributeId == colorAttribute?.id,
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
                        value={(field.value || []) as Option[]}
                        onChange={(options) => field.onChange(options as any)}
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
    </Card>
  );
};

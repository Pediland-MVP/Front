"use client";

import { useSelectOnFocus } from "@/hooks/useSelectOnFocus";
import { formatNumber } from "@/utils/formatNumber";
import { onInputP2EHandler } from "@/utils/p2eNumber";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import {
  Card,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@/components/ui";

export const FormShippingCost = () => {
  const { control, watch, setValue } = useFormContext();
  const t = useTranslations("Products.Form");
  const { onFocus } = useSelectOnFocus();

  useEffect(() => {
    if (watch("isDigital")) {
      setValue("shippingCost", 0);
    }
  }, [watch("isDigital")]);

  if (watch("isDigital")) {
    return null;
  }

  return (
    <Card className="gap-3 p-3 xl:p-5">
      <FormField
        control={control}
        name="shippingCost"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("shippingCost.label")}</FormLabel>
            <Input
              value={formatNumber(field.value)}
              onChange={(e) => field.onChange(+e.target.value)}
              placeholder={t("shippingCost.placeholder")}
              onInput={onInputP2EHandler}
              onFocus={onFocus}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </Card>
  );
};

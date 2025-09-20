'use client'
import { onInputP2EHandler } from "@/utils/p2eNumber";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/index";
import { useSelectOnFocus } from "@/hooks/useSelectOnFocus";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

export function ShippingCost() {
  const { control, watch, setValue } = useFormContext();
  const t = useTranslations("Products.Form");
  const { onFocus } = useSelectOnFocus();

  useEffect(() => {
    if (watch('isDigital')) {
      setValue('shippingCost', 0)
    }
  }, [watch('isDigital')])

  if (watch('isDigital')) {
    return null
  }

  return (
    <div className="space-y-3 bg-blue-50/50 rounded-xl border border-blue-100 p-3 xl:p-5">
      <FormField
        control={control}
        name="shippingCost"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("shippingCost.label")}</FormLabel>
            <Input
              {...field}
              onChange={(e) => field.onChange(+e.target.value)}
              placeholder={t("shippingCost.placeholder")}
              onInput={onInputP2EHandler}
              onFocus={onFocus}
            />
            <FormMessage/>
          </FormItem>
        )}
      />
    </div>
  );
}

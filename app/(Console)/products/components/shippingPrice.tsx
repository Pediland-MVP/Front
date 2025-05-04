'use client'
import { onInputP2EHandler } from "@/app/utils/p2eNumber";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/theme/ui/form";
import { Input } from "@/components/theme/ui/input";
import ErrorMessage from "@/components/ui/errorMessage";
import { useSelectOnFocus } from "@/hooks/useSelectOnFocus";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";

export function ShippingPrice() {
  const { control } = useFormContext();
  const t = useTranslations("Products.Form");
  const { onFocus } = useSelectOnFocus();

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

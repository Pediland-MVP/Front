import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from "@/components/ui";
import { StorefrontIcon } from "@phosphor-icons/react/dist/ssr";

export const FormVitrinDetails = () => {
  const form = useFormContext();
  const t = useTranslations("Products.Form.Vitrin");

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <StorefrontIcon weight="duotone" /> {t("vitrin_details")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {/* Item Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("title_label")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Item Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("description_label")}</FormLabel>
              <FormControl>
                <Textarea rows={6} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

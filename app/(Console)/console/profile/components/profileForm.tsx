"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
// UI
import { Card } from "@/components/theme/ui/card";
import { Input } from "@/components/theme/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/theme/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/theme/ui/select";

export function ProfileForm() {
  const t = useTranslations("Profile.Form");
  const locale = useLocale();

  const formSchema = z.object({
    gender: z.string().optional(),
    birthDate: z.string().optional(),
    firstname: z.string().optional(),
    lastname: z.string().optional(),
    email: z.string().email().readonly(),
    mobile: z.string().readonly(),
    state: z.string().optional(),
    city: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log(data);
  };

  return (
    <Card className="h-full md:border-l-2 border-gray-100 p-6 md:p-10">
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-2"
        >
          <div className="grid md:grid-cols-4 gap-2">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t("gender")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    dir="rtl"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("genderSelect")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="female">{t("female")}</SelectItem>
                      <SelectItem value="male">{t("male")}</SelectItem>
                      <SelectItem value="other">{t("other")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t("birthDate")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    dir="rtl"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("birthDateSelect")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="female">{t("female")}</SelectItem>
                      <SelectItem value="male">{t("male")}</SelectItem>
                      <SelectItem value="other">{t("other")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstname"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t("firstname")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  {form.formState.errors?.firstname && (
                    <span className="text-red-500 text-sm">
                      {t(
                        `Errors.firstname.${form.formState.errors.firstname.type}`
                      )}
                    </span>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastname"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t("lastname")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  {form.formState.errors?.lastname && (
                    <span className="text-red-500 text-sm">
                      {t(
                        `Errors.lastname.${form.formState.errors.lastname.type}`
                      )}
                    </span>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  {form.formState.errors?.email && (
                    <span className="text-red-500 text-sm">
                      {t(`Errors.email.${form.formState.errors.email.type}`)}
                    </span>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t("mobile")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  {form.formState.errors?.mobile && (
                    <span className="text-red-500 text-sm">
                      {t(`Errors.mobile.${form.formState.errors.mobile.type}`)}
                    </span>
                  )}
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {locale === "fa" && (
              <>
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem className="col-span-3 md:col-span-1">
                      <FormLabel>{t("state")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      {form.formState.errors?.state && (
                        <span className="text-red-500 text-sm">
                          {t(
                            `Errors.country.${form.formState.errors.state.type}`
                          )}
                        </span>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="col-span-3 md:col-span-1">
                      <FormLabel>{t("city")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      {form.formState.errors?.city && (
                        <span className="text-red-500 text-sm">
                          {t(`Errors.city.${form.formState.errors.city.type}`)}
                        </span>
                      )}
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-10">
            <Button type="submit" className="w-full">
              {t("save")}
            </Button>
            <Button className="w-full" variant="outline">
              {t("cancel")}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Card>
  );
}

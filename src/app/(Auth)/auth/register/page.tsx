// Refactored
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Button,
  ButtonLoading,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  LoaderSpin,
} from "@components";
import { UserCirclePlusIcon } from "@phosphor-icons/react/dist/ssr";
import { MoveLeftIcon } from "lucide-react";

export default function RegisterPage() {
  const t = useTranslations("Auth.Register");
  const t_ec = useTranslations("ERROR_CODES");
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = z.object({
    firstname: z.string().min(3, t("enter_first_name")),
    lastname: z.string().min(3, t("enter_last_name")),
    instagramId: z.string().min(3, t("enter_instagram_id")),
    referralCode: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      instagramId: "",
      referralCode: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);
  };

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mb-12 flex flex-1 items-end justify-center">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <UserCirclePlusIcon size={28} weight="duotone" />
          {t("title")}
        </h1>
      </div>

      <div className="space-y-5">
        <div className="flex flex-col text-center text-[15px] font-medium">
          <div>{t("complete_registration_form")}</div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstname"
              render={({ field }) => (
                <FormItem className="col-span-4 sm:col-span-2">
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="given-name"
                      placeholder={t("first_name_placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastname"
              render={({ field }) => (
                <FormItem className="col-span-4 sm:col-span-2">
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="family-name"
                      placeholder={t("last_name_placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagramId"
              render={({ field }) => (
                <FormItem className="col-span-4">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("instagram_id_placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referralCode"
              render={({ field }) => (
                <FormItem className="col-span-4 sm:col-span-4">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("referral_code_placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ButtonLoading
              className="w-full"
              disabled={
                isLoading ||
                !form.watch("firstname") ||
                !form.watch("lastname") ||
                !form.watch("instagramId") ||
                !form.formState.isValid
              }
              isLoading={isLoading}
            >
              {t("confirm_and_continue")}
            </ButtonLoading>
          </form>
        </Form>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center"></div>
    </div>
  );
}

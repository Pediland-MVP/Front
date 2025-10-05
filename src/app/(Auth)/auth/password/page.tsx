"use client";

import {
  Button,
  ButtonLoading,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  InputOTP,
} from "@/components";
import { InputPassword } from "@/components/ui-custom/InputPassword";
import { PasswordIcon } from "@phosphor-icons/react/dist/ssr";
import { MoveLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function PasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("Auth.Password");
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = (data: { password: string }) => {
    console.log("onSubmit", data);
  };

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="flex flex-1 items-end justify-center mb-12">
        <h1 className="flex text-lg items-center gap-2 font-bold">
          <PasswordIcon size={28} weight="duotone" />
          {t("title")}
        </h1>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col text-center text-[15px] font-medium">
          <div>{t("enter_your_password")}</div>
          <div className="flex items-center justify-center">
            <span className="text-primary text-base tracking-widest">
              09123786907
            </span>

            <Button
              variant="link"
              type="button"
              size="sm"
              className="text-muted-foreground text-[13px]"
              onClick={() => router.back()}
            >
              {t("change_number")}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-w-[240px] flex-col items-center justify-center space-y-4"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <InputPassword {...field} placeholder={t("password")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              variant="link"
              type="button"
              size="sm"
              className="text-muted-foreground h-auto text-[13px] font-normal"
            >
              {t("forgot_password")}
            </Button>

            <ButtonLoading
              isLoading={isLoading}
              disabled={isLoading}
              className="w-full"
            >
              {t("confirm_and_continue")}
            </ButtonLoading>
          </form>
        </Form>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <Button
          variant="link"
          type="button"
          className="text-muted-foreground"
          onClick={() => router.back()}
        >
          {t("back")}
          <MoveLeftIcon />
        </Button>
      </div>
    </div>
  );
}

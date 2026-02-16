"use client";

import api, { setAccessToken } from "@/hooks/swr/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { mutate } from "swr";
import { z } from "zod";

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui";
import { ButtonLoading } from "@/components/ui-custom/ButtonLoading";
import { InputPassword } from "@/components/ui-custom/InputPassword";
import { PasswordIcon } from "@phosphor-icons/react";
import { MoveLeftIcon, MoveRightIcon } from "lucide-react";
import SupportButton from "../supportButton";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export default function PasswordPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Auth");
  const t_err = useTranslations("Auth.Errors");
  const t_ec = useTranslations("ERROR_CODES");

  const [mobile, setMobile] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgetLoading, setIsForgetLoading] = useState(false);

  useEffect(() => {
    const storedMobile = sessionStorage.getItem("prelogin_mobile");

    if (!storedMobile) {
      router.replace("/auth");
      return;
    }

    setMobile(storedMobile);
    setChecked(true);

    // Don't remove sessionStorage on cleanup as it might be needed for navigation
  }, [router]);

  const formSchema = z.object({
    emailOrMobile: z.string(),
    password: z.string().min(6, t_err("password_min_length")),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      emailOrMobile: "",
      password: "",
    },
  });

  useEffect(() => {
    if (mobile) form.setValue("emailOrMobile", mobile);
  }, [mobile, form]);

  const forgetPasswordHandler = async () => {
    setIsForgetLoading(true);

    try {
      const response = await api.post(`${API_URL}/auth/mobile/forgetPassword`, {
        mobile,
      });

      if (response.data?.data?.next === "otp") {
        if (typeof window !== "undefined" && mobile) {
          sessionStorage.setItem("prelogin_mobile", mobile);
        }
        router.push("/auth/otp");
      }
    } catch (error) {
      if (error?.response?.data?.statusCode === 429) {
        toast.error(t_ec("TOO_MANY_REQUESTS"));
      } else {
        console.error("❌ API Error:", error.response?.data);
        toast.error(error.response?.data?.message);
      }
      setIsForgetLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const res = await api.post(`${API_URL}/auth/mobile/signIn`, data, {
        withCredentials: true,
      });
      setAccessToken(res?.data?.data?.accessToken);
      await mutate(() => true);
      router.push("/");
    } catch (error) {
      const message = error.response?.data?.message;
      if (message === "SignIn data is invalid") {
        toast.error(t_ec("PASSWORD_INVALID"));
      } else {
        toast.error(message);
      }
      setIsLoading(false);
    }
  };

  if (!checked) return null;

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mb-12 flex flex-1 items-end justify-center">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <PasswordIcon size={28} weight="duotone" />
          {t("title_password")}
        </h1>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col text-center text-[15px] font-medium">
          <div>{t("enter_your_password")}</div>
          <div className="flex items-center justify-center">
            <span className="text-primary text-base tracking-widest">
              {mobile}
            </span>
            <Button
              variant="link"
              type="button"
              size="sm"
              className="text-muted-foreground text-[13px]"
              onClick={() => {
                router.push("/auth");
              }}
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
                    <InputPassword
                      className="text-center"
                      {...field}
                      placeholder={t("password")}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ButtonLoading
              isLoading={isForgetLoading}
              disabled={isForgetLoading}
              onClick={forgetPasswordHandler}
              variant="link"
              type="button"
              size="sm"
              className="text-muted-foreground h-auto text-[13px] font-normal"
            >
              {t("forgot_password")}
            </ButtonLoading>

            <ButtonLoading
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading || !form.formState.isValid}
            >
              {t("confirm_and_continue")}
            </ButtonLoading>
          </form>
        </Form>
      </div>
      <SupportButton type="external"/>

      <div className="flex flex-1 flex-col items-center justify-center">
        <Button
          variant="link"
          type="button"
          className="text-muted-foreground"
          disabled={isLoading || isForgetLoading}
          onClick={() => {
            router.push("/auth");
          }}
        >
          {t("back")}
          {locale === "fa" ? <MoveLeftIcon /> : <MoveRightIcon />}
        </Button>
      </div>
    </div>
  );
}

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
import { zodResolver } from "@hookform/resolvers/zod";
import { PasswordIcon } from "@phosphor-icons/react/dist/ssr";
import { MoveLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import axios from "axios";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export default function PasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isForgetLoading, setIsForgetLoading] = useState(false);
  const t = useTranslations("Auth.Password");
  const t_ec = useTranslations("ERROR_CODES");
  const router = useRouter();
  const [mobile, setMobile] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedMobile = sessionStorage.getItem("prelogin_mobile");

      if (storedMobile) {
        setMobile(storedMobile);
      } else {
        router.push("/auth");
      }
    }
  }, [router]);

  const formSchema = z.object({
    emailOrMobile: z.string(),
    password: z.string().min(6, t_ec("PASSWORD_LENGTH_MIN")),
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
    if (mobile) {
      form.setValue("emailOrMobile", mobile);
    }
  }, [mobile, form]);

  const forgetPasswordHandler = async () => {
    setIsForgetLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/auth/mobile/forgetPassword`,
        {
          mobile: mobile,
        },
      );

      const next = response.data?.data?.next;

      if (next === "otp") {
        router.push(`/auth/signin`);
      }
    } catch (error) {
      if (error?.response?.data?.statusCode === 429) {
        toast.error("بین هر درخواست کد باید 2 دقیقه فاصله باشد.");
      } else {
        toast.error(t_ec(error?.code));
      }
      setIsForgetLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/mobile/signIn`, data);
      router.push("/");
    } catch (error) {
      const message = error.response?.data?.message;
      if (message === "SignIn data is invalid") {
        toast.error(t_ec("PASSWORD_INVALID"));
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mb-12 flex flex-1 items-end justify-center">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <PasswordIcon size={28} weight="duotone" />
          {t("title")}
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
              onClick={() => router.push("/auth")}
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
              disabled={
                isLoading ||
                !form.watch("password") ||
                form.watch("password").length < 6 ||
                !form.formState.isValid
              }
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
          onClick={() => router.push("/auth")}
        >
          {t("back")}
          <MoveLeftIcon />
        </Button>
      </div>
    </div>
  );
}

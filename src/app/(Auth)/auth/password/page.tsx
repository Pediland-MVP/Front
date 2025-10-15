"use client";

import api, { setAccessToken, getAccessToken } from "@/hooks/swr/api-client";
import { useGlobalLoading } from "@/components/Providers/GlobalLoadingProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  Button,
  ButtonLoading,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  InputPassword,
  LoadingLogo,
} from "@components";
import { PasswordIcon } from "@phosphor-icons/react";
import { MoveLeftIcon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export default function PasswordPage() {
  const router = useRouter();
  const { setLoading: setGlobalLoading } = useGlobalLoading();
  const t = useTranslations("Auth");
  const t_err = useTranslations("Auth.Errors");
  const t_ec = useTranslations("ERROR_CODES");

  const [mobile, setMobile] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgetLoading, setIsForgetLoading] = useState(false);

  // -------------------------
  // 1️⃣ Security Check (مانند OTP)
  // -------------------------
  useEffect(() => {
    // const accessToken = getAccessToken();
    const storedMobile = sessionStorage.getItem("prelogin_mobile");

    // اگر لاگین کرده نباید وارد این صفحه بشه
    // if (accessToken) {
    //   // setGlobalLoading(true);
    //   router.replace("/");
    //   return;
    // }

    // اگر شماره موبایل وجود نداشت → /auth
    if (!storedMobile) {
      // setGlobalLoading(true);
      router.replace("/auth");
      return;
    }

    // ✅ شرایط درست
    setMobile(storedMobile);
    // setIsChecking(false);
    // setGlobalLoading(false);

    // پاکسازی هنگام خروج از صفحه
    return () => sessionStorage.removeItem("prelogin_mobile");
  }, [router, setGlobalLoading]);

  // -------------------------
  // 2️⃣ Form Schema
  // -------------------------
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

  // -------------------------
  // 3️⃣ Handlers
  // -------------------------
  const forgetPasswordHandler = async () => {
    setIsForgetLoading(true);
    try {
      const response = await api.post(`${API_URL}/auth/mobile/forgetPassword`, {
        mobile,
      });
      if (response.data?.data?.next === "otp") {
        setGlobalLoading(true);
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
      useAuthStore.getState().setAuth({
        isLoggedIn: true,
        token: res.data.data.accessToken,
      });

      setGlobalLoading(true);
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

  // -------------------------
  // 4️⃣ Render Control (بدون فلیکر)
  // -------------------------
  // if (isChecking || !mobile) {
  //   return <LoadingLogo />;
  // }

  // -------------------------
  // 5️⃣ Render Form
  // -------------------------
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
                setGlobalLoading(true);
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

      <div className="flex flex-1 flex-col items-center justify-center">
        <Button
          variant="link"
          type="button"
          className="text-muted-foreground"
          onClick={() => {
            setGlobalLoading(true);
            router.push("/auth");
          }}
        >
          {t("back")}
          <MoveLeftIcon />
        </Button>
      </div>
    </div>
  );
}

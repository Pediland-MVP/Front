//Refactored
"use client";

import api, { clearAccessToken } from "@/hooks/swr/api-client";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  Button,
  ButtonLoading,
  CounterDown,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components";
import { CircleNotchIcon, NumpadIcon } from "@phosphor-icons/react/dist/ssr";
import { MoveLeftIcon, RefreshCwIcon } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export default function SignInPage() {
  const router = useRouter();
  const t = useTranslations("Auth.OTP");
  const t_ec = useTranslations("ERROR_CODES");
  const [isLoading, setIsLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
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
    otp: z.string().length(6, t("errors.otpLength")),
    mobile: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
      mobile: "",
    },
  });

  useEffect(() => {
    if (mobile) {
      form.setValue("mobile", mobile);
    }
  }, [mobile, form]);

  const firstSlotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (firstSlotRef.current) {
      firstSlotRef.current.focus();
    }
  }, []);

  const resendHandler = async () => {
    setIsResendLoading(true);

    try {
      const res = await axios.get(`${API_URL}/auth/prelogin`, {
        params: {
          mobile,
        },
      });
      console.log("✅ API Response:", res.data?.data);
      toast.success(t("toasts.resendOk"));
    } catch (e: any) {
      console.log("❌ API Error:", e.response?.data);
      const message = t_ec(e.response?.data?.code);
      toast.error(message);
    } finally {
      setIsResendLoading(false);
    }
  };

  const otpCompleted = () => {
    form.handleSubmit(onSubmit)();
  };

  // const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  // const logoutHandler = async (
  //   e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  // ) => {
  //   e.preventDefault();
  //   setIsLogoutLoading(true);
  //   await api
  //     .delete("/auth/logout")
  //     .then(async (res) => {
  //       clearAccessToken();
  //       router.push(process.env.NEXT_PUBLIC_MAIN_SITE_URL);
  //     })
  //     .catch((e) => {
  //       toast.error(t("logoutFailed"));
  //     })
  //     .finally(() => {
  //       setIsLogoutLoading(false);
  //     });
  // };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    console.log("Form values:", values);

    try {
      const res = await api.post("/auth/mobile/oneTime/signIn", values);
      toast.success(t("toasts.loginSuccess"));
      router.push("/");
    } catch (e: any) {
      const message = t_ec(e.response?.data?.code);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mb-12 flex flex-1 items-end justify-center">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <NumpadIcon size={28} weight="duotone" />
          {t("title")}
        </h1>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col text-center text-[15px] font-medium">
          <div>{t("code_sent_to_mobile")}</div>
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
            className="flex flex-col items-center justify-center space-y-4"
          >
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      {...field}
                      pattern={REGEXP_ONLY_DIGITS}
                      ref={firstSlotRef}
                      onComplete={otpCompleted}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-muted-foreground flex items-center gap-2 text-[15px]">
              {!showResend ? (
                <CounterDown time={120} onEnd={() => setShowResend(true)} />
              ) : (
                <Button
                  variant="link"
                  type="button"
                  size="sm"
                  className="text-muted-foreground h-auto text-[13px] font-normal"
                  onClick={resendHandler}
                  disabled={isResendLoading}
                >
                  {isResendLoading ? (
                    <CircleNotchIcon className="animate-spin" size={16} />
                  ) : (
                    <>
                      <RefreshCwIcon className="size-3.5" />
                      {t("resend_code")}
                    </>
                  )}
                </Button>
              )}
            </div>

            <ButtonLoading
              isLoading={isLoading}
              disabled={isLoading}
              className="w-full"
              onClick={form.handleSubmit(onSubmit)}
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

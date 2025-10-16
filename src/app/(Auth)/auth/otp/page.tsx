"use client";

import api, { setAccessToken, getAccessToken } from "@/hooks/swr/api-client";
import { useGlobalLoading } from "@/components/Providers/GlobalLoadingProvider";
import { zodResolver } from "@hookform/resolvers/zod";
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
  LoadingLogo,
} from "@/components";
import { CircleNotchIcon, NumpadIcon } from "@phosphor-icons/react";
import { RefreshCwIcon } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export default function OtpPage() {
  const router = useRouter();
  const { setLoading: setGlobalLoading } = useGlobalLoading();
  const t = useTranslations("Auth");
  const t_err = useTranslations("Auth.Errors");
  const t_ec = useTranslations("ERROR_CODES");

  const [mobile, setMobile] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  // -------------------------
  // 1️⃣ Security Check
  // -------------------------
  useEffect(() => {
    // const accessToken = getAccessToken();
    const storedMobile = sessionStorage.getItem("prelogin_mobile");

    // if (accessToken) {
    //   // 🔹 در حال ریدایرکت به صفحه اصلی
    //   setGlobalLoading(true);
    //   router.replace("/");
    //   return;
    // }

    if (!storedMobile) {
      setGlobalLoading(true);
      router.replace("/auth");
      return;
    }

    // ✅ شرایط درست
    setMobile(storedMobile);
    // setIsChecking(false);
    // setGlobalLoading(false);

    return () => sessionStorage.removeItem("prelogin_mobile");
  }, [router, setGlobalLoading]);

  // -------------------------
  // 2️⃣ Form
  // -------------------------
  const formSchema = z.object({
    otp: z.string().length(5, t_err("otp_length")),
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
    if (mobile) form.setValue("mobile", mobile);
  }, [mobile, form]);

  const otpCompleted = () => form.handleSubmit(onSubmit)();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // setIsLoading(true);
    try {
      const res = await api.post("/auth/mobile/oneTime/signIn", values);
      setAccessToken(res?.data?.data?.accessToken);
      const me = await api.get("/users/me");

      // پاکسازی sessionStorage
      sessionStorage.removeItem("prelogin_mobile");

      // setGlobalLoading(true);
      if (me?.data?.status === "onboarding") router.push("/auth/register");
      else router.push("/");
    } catch (error) {
      console.error("❌ API Error:", error.response?.data);
      toast.error(t_ec(error.response?.data?.code));
      setIsLoading(false);
    }
  };

  const resendHandler = async () => {
    setIsResendLoading(true);
    try {
      await api.get(`${API_URL}/auth/prelogin`, { params: { mobile } });
      setShowResend(false);
      toast.success(t("Toasts.code_resent"));
    } catch (error) {
      if (error?.response?.data?.statusCode === 429)
        toast.error(t_ec("TOO_MANY_REQUESTS"));
      else toast.error(error.response?.data?.message || "Error");
    } finally {
      setIsResendLoading(false);
    }
  };

  // -------------------------
  // 3️⃣ Render Control
  // -------------------------
  // if (isChecking || !mobile) {
  //   return <LoadingLogo />;
  // }

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mb-12 flex flex-1 items-end justify-center">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <NumpadIcon size={28} weight="duotone" />
          {t("title_login_otp")}
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
            className="flex flex-col items-center justify-center space-y-4"
          >
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputOTP
                      maxLength={5}
                      {...field}
                      pattern={REGEXP_ONLY_DIGITS}
                      onComplete={otpCompleted}
                    >
                      <InputOTPGroup autoFocus>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage className="text-center" />
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
              disabled={
                isLoading || !form.watch("otp") || !form.formState.isValid
              }
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

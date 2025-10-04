//Refactored
"use client";

import api, { clearAccessToken } from "@/hooks/swr/api-client";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
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
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { MoveLeftIcon, RotateCwIcon } from "lucide-react";

export default function VerifyOTP() {
  const t = useTranslations("Auth.Verify");
  const t_ec = useTranslations("ERROR_CODES");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  const formSchema = z.object({
    otp: z.string().length(5, t("errors.otpLength")),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  const firstSlotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (firstSlotRef.current) {
      firstSlotRef.current.focus();
    }
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    await api
      .post("/auth/mobile/verifyOtp", values)
      .then((res) => {
        toast.success(t("toasts.loginSuccess"));
        router.push("/");
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        const message = t_ec(e.response?.data?.code);
        toast.error(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const resendHandler = async () => {
    setIsResendLoading(true);
    await api
      .post("/auth/mobile/resendOtp")
      .then((res) => {
        toast.success(t("toasts.resendOk"));
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        const message = t_ec(e.response?.data?.code);
        toast.error(message);
      })
      .finally(() => {
        setIsResendLoading(false);
      });
  };

  const otpCompleted = () => {
    form.handleSubmit(onSubmit)();
  };

  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const logoutHandler = async (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    e.preventDefault();
    setIsLogoutLoading(true);
    await api
      .delete("/auth/logout")
      .then(async (res) => {
        clearAccessToken();
        router.push(process.env.NEXT_PUBLIC_MAIN_SITE_URL);
      })
      .catch((e) => {
        toast.error(t("logoutFailed"));
      })
      .finally(() => {
        setIsLogoutLoading(false);
      });
  };

  return (
    <div className="flex flex-1 flex-col justify-center gap-10">
      <div className="flex flex-1 items-end justify-center">
        <h1 className="font-bold">ورود با رمز یکبار مصرف</h1>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col text-center text-[15px] font-medium">
          <div>{t("code_sent_to_mobile")}</div>
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
                      ref={firstSlotRef}
                      onComplete={otpCompleted}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-muted-foreground flex items-center gap-2 text-[15px]">
              {!showResend ? (
                <CounterDown time={30} onEnd={() => setShowResend(true)} />
              ) : (
                <Button
                  variant="link"
                  type="button"
                  size="sm"
                  className="h-auto text-[13px] text-muted-foreground"
                  onClick={resendHandler}
                  disabled={isResendLoading}
                >
                  {isResendLoading ? (
                    <CircleNotchIcon className="animate-spin" size={16} />
                  ) : (
                    <>
                      <RotateCwIcon />
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

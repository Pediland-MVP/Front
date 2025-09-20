"use client";

import ButtonLoading from "@/components/ui/button-loading";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import api, { clearAccessToken } from "@/hooks/swr/api-client";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { AxiosError } from "axios";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default function VerifyOTP() {
  const t = useTranslations("Auth.Verify");
  const t_ec = useTranslations("ERROR_CODES");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isResendLoading, setIsResendLoading] = useState(false);

  const formSchema = z.object({
    otp: z.string().length(6, t("errors.otpLength")),
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
    <main className="flex h-svh w-full items-center justify-center">
      <div className="container mx-auto max-w-6xl px-3 sm:px-4 xl:px-0">
        <div className="flex h-full items-center justify-center">
          <div className="mx-auto w-full text-center sm:w-1/3">
            <h1 className="text-2xl font-semibold">{t("title")}</h1>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex w-full flex-col items-center justify-center"
              >
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem className="my-6 flex flex-col items-center justify-center">
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
                      <FormDescription>{t("otpDescription")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <ButtonLoading
                  isLoading={isLoading}
                  type="submit"
                  className="col-span-4 w-9/12 text-white"
                  color="success"
                  disabled={isLoading}
                  size={"lg"}
                >
                  {t("verifyButton")}
                </ButtonLoading>
              </form>
            </Form>
            <div className="mt-4">
              <p
                className="flex cursor-pointer items-center justify-center text-sm font-light text-gray-400 duration-300 hover:text-gray-700"
                onClick={resendHandler}
              >
                {isResendLoading ? (
                  <CircleNotchIcon className="animate-spin" />
                ) : (
                  t("resendCode")
                )}
              </p>

              <p
                className="flex cursor-pointer items-center justify-center text-sm font-light text-gray-400 duration-300 hover:text-gray-700"
                onClick={logoutHandler}
              >
                {isLogoutLoading ? (
                  <CircleNotchIcon className="animate-spin" />
                ) : (
                  t("logout")
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

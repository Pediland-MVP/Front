"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import ButtonLoading from "@/components/ui/button-loading";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import api, { clearAccessToken } from "@/hooks/swr/api-client";
import { AxiosError } from "axios";
import { ExceptionMessage } from "@/types/exceptionMessage";

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
        toast({
          title: t("toasts.loginSuccess"),
          description: t("toasts.welcomeMessage"),
        });
        router.push("/");
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        const message = t_ec(e.response?.data?.code);
        toast({
          title: message,
          variant: "destructive",
        });
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
        toast({
          title: t("toasts.resendOk"),
        });
      })
      .catch((e: AxiosError<ExceptionMessage>) => {
        const message = t_ec(e.response?.data?.code);
        toast({
          title: message,
          variant: "destructive",
        });
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
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    e.preventDefault();
    setIsLogoutLoading(true);
    await api
      .delete("/auth/logout")
      .then(async (res) => {
        clearAccessToken()
        router.push(process.env.NEXT_PUBLIC_MAIN_SITE_URL);
      })
      .catch((e) => {
        toast({
          title: t("logoutFailed"),
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLogoutLoading(false);
      });
  };

  return (
    <main className=" h-svh w-full flex justify-center items-center">
      <div className="container max-w-6xl px-3 sm:px-4 xl:px-0 mx-auto">
        <div className="flex items-center justify-center h-full">
          <div className="text-center w-full sm:w-1/3 mx-auto">
            <h1 className="text-2xl font-semibold">{t("title")}</h1>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="w-full flex flex-col justify-center items-center"
              >
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem className="my-6 flex flex-col justify-center items-center">
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
                  className="col-span-4 text-white w-9/12"
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
                className="text-sm text-gray-400 hover:text-gray-700 font-light duration-300 cursor-pointer flex justify-center items-center"
                onClick={resendHandler}
              >
                {isResendLoading ? (
                  <CircleNotch className="animate-spin" />
                ) : (
                  t("resendCode")
                )}
              </p>

              <p
                className="text-sm text-gray-400 hover:text-gray-700 font-light duration-300 cursor-pointer flex justify-center items-center"
                onClick={logoutHandler}
              >
                {isLogoutLoading ? (
                  <CircleNotch className="animate-spin" />
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

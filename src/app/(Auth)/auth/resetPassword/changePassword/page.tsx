"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { InputPassword } from "@/components/ui/inputPassword";
import { REGEX_PASSWORD } from "@/utils/regex";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyholeIcon } from "@phosphor-icons/react/dist/ssr";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import ResetButton from "./resendButton";

export default function ResetPasswordForm() {
  const t = useTranslations("Auth.ResetPassword.ChangePassword");
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();

  const formSchema = z.object({
    mobile: z
      .string()
      .min(1, { message: t("mobileRequired") })
      .regex(/^[0-9]+$/, { message: t("mobileInvalid") }),
    otp: z.string().length(6, { message: t("codeLength") }),
    password: z
      .string()
      .min(8, { message: t("passwordValidation") })
      .regex(REGEX_PASSWORD, {
        message: t("passwordValidation"),
      }),
    confirmPassword: z
      .string()
      .min(8, { message: t("passwordValidation") })
      .regex(REGEX_PASSWORD, {
        message: t("passwordValidation"),
      }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mobile: searchParams.get("mobile") || "",
      otp: "",
      password: "",
      confirmPassword: "",
    },
  });

  const firstSlotRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (firstSlotRef.current) {
      firstSlotRef.current.focus();
    }
  }, []);

  const otpCompleted = () => {
    form.setFocus("password");
  };

  const router = useRouter();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    if (values.password !== values.confirmPassword) {
      form.setError(
        "confirmPassword",
        {
          message: t("passwordsDontMatch"),
          type: "pattern",
        },
        {
          shouldFocus: true,
        },
      );
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/mobile/resetPassword`,
        {
          method: "PATCH",
          body: JSON.stringify(values),
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) {
        if (res.status === 429) {
          toast.error(t("tryAgainLater"));
          return;
        }

        if (res.status === 410) {
          toast.error(t("codeExpired"));
          return;
        }

        if (res.status === 400) {
          toast.error(t("invalidCode"));
          return;
        }

        toast.error(t("resetRequestError"));
        return;
      }

      toast.success(t("resetRequestSent"));

      router.push("/auth/signin");
    } catch (e) {
      toast.error(t("resetRequestError"));
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-full bg-blue-50/75">
      <div className="container h-full max-w-6xl px-6 sm:px-0">
        <div className="flex h-full items-center justify-center">
          <div className="mx-auto w-full sm:w-1/3">
            <div className="mb-6 flex flex-col gap-2">
              <div className="flex items-center justify-center gap-2">
                <KeyholeIcon className="text-primary h-9 w-9" />
                <h1 className="text-primary text-2xl font-semibold">
                  {t("resetPassword")}
                </h1>
              </div>
              <p className="text-center text-sm text-gray-500">
                {t("enterMobile")}
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder={t("mobilePlaceholder")}
                          disabled
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                            <InputOTPSlot className="bg-white" index={0} />
                            <InputOTPSeparator />
                            <InputOTPSlot className="bg-white" index={1} />
                            <InputOTPSeparator />
                            <InputOTPSlot className="bg-white" index={2} />
                            <InputOTPSeparator />
                            <InputOTPSlot className="bg-white" index={3} />
                            <InputOTPSeparator />
                            <InputOTPSlot className="bg-white" index={4} />
                            <InputOTPSeparator />
                            <InputOTPSlot className="bg-white" index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormDescription>{t("otpDescription")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="col-span-4">
                      <FormControl>
                        <InputPassword
                          {...field}
                          placeholder={t("enterPasswordPlaceholder")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="col-span-4">
                      <FormControl>
                        <InputPassword
                          {...field}
                          placeholder={t("confirmPasswordPlaceholder")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <ResetButton mobile={form.getValues().mobile} />

                <Button
                  type="submit"
                  className="w-full text-white"
                  disabled={isLoading}
                >
                  {isLoading ? t("sending") : t("sendResetLink")}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </main>
  );
}

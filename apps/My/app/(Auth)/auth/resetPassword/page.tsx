"use client";

import { Button } from "@befroosh/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@befroosh/ui";
import { Input } from "@befroosh/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, KeyholeIcon } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default function ResetPasswordForm() {
  const t = useTranslations("Auth.ResetPassword");
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = z.object({
    mobile: z
      .string()
      .min(1, { message: t("mobileRequired") })
      .regex(/^[0-9]+$/, { message: t("mobileInvalid") }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mobile: "",
    },
  });

  const router = useRouter();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/mobile/sendResetPasswordCode`,
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

        toast.error(t("resetRequestError"));
        return;
      }

      toast.success(t("resetRequestSent"));

      router.push(`/auth/resetPassword/changePassword?mobile=${values.mobile}`);
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
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full text-white"
                  disabled={isLoading}
                >
                  {isLoading ? t("sending") : t("sendResetLink")}
                </Button>
              </form>
            </Form>

            <Button
              variant="link"
              className="text-muted-foreground mt-10 w-full"
              onClick={() => router.push("/auth/signin")}
            >
              {t("backToLogin")}
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

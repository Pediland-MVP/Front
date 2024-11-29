"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/theme/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Keyhole } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";

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

  const router = useRouter()

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/mobile/sendResetPasswordCode`, {
            method: "PATCH",
            body: JSON.stringify(values),
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            }
        })
        
        if (!res.ok) {

            if (res.status === 429) {
                toast({
                    title: t("tryAgainLater"),
                    variant: "destructive",
                });
                return
            }

            toast({
                title: t("resetRequestError"),
                description: t("resetRequestErrorDescription"),
                variant: "destructive",
            });
            return
        }

        toast({
            title: t("resetRequestSent"),
            description: t("checkMobile"),
        });

        router.push(`/auth/resetPassword/changePassword?mobile=${values.mobile}`)

    }
    catch(e) {
        toast({
            title: t("resetRequestError"),
            description: t("resetRequestErrorDescription"),
            variant: "destructive",
        });
        return
    }
    finally {
        setIsLoading(false);
    }
  };

  return (
    <main className="h-full bg-fuchsia-50/75">
      <div className="container max-w-6xl px-6 sm:px-0 h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center w-full sm:w-1/3 mx-auto">
            <div className="mb-6 flex flex-col gap-2">
              <div className="flex items-center justify-center gap-2">
                <Keyhole className="h-9 w-9 text-primary" />
                <h1 className="text-2xl font-semibold text-primary">
                  {t("resetPassword")}
                </h1>
              </div>
              <p className="text-sm text-gray-500 text-center">
                {t("enterMobile")}
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          </div>
        </div>
      </div>
    </main>
  );
}


"use client";

import api from "@/hooks/swr/api-client";
import { onInputP2EHandler } from "@/utils/p2eNumber";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { LogoText } from "@/components/Global/LogoText";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
} from "@/components/ui";
import { ButtonLoading } from "@/components/ui-custom/ButtonLoading";
import { MoveLeftIcon } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_LANDING_URL;

export default function AuthPage() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const t_err = useTranslations("Auth.Errors");
  const t_ec = useTranslations("ERROR_CODES");
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = z.object({
    mobile: z.string().regex(/^(?:|0|09|09\d{1,9})$/, {
      message: t_err("number_should_start_with_09"),
    }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      mobile: "",
    },
  });

  const onSubmit = async (data: { mobile: string }) => {
    setIsLoading(true);

    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("prelogin_mobile", data.mobile);
      }

      const response = await api.get(`${API_URL}/auth/prelogin`, {
        params: {
          mobile: data.mobile,
        },
      });

      const next = response.data?.data?.next;

      if (next === "password") {
        router.push(`/auth/password`);
      } else if (next === "otp") {
        router.push(`/auth/otp`);
      }
    } catch (error) {
      if (error?.response?.data?.statusCode === 429) {
        toast.error(t_ec("TOO_MANY_REQUESTS"));
        setIsLoading(false);
      } else {
        console.error("❌ API Error:", error.response?.data);
        const message = error.response?.data?.message;
        toast.error(message);
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-12 flex flex-1 items-end justify-center">
        <LogoText />
      </div>

      <div className="space-y-5">
        <div className="text-center text-[15px] font-medium">
          <div>{t.rich("title", { br: () => <br /> })}</div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="min-w-[240px] space-y-3"
          >
            <FormField
              control={form.control}
              name="mobile"
              render={({ field, fieldState: { error } }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="text-center tracking-widest"
                      dir="ltr"
                      placeholder={t("mobile_palceholder")}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={11}
                      value={field.value}
                      onInput={onInputP2EHandler}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        field.onChange(value);
                      }}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      aria-invalid={!!error}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ButtonLoading
              isLoading={isLoading}
              className="w-full"
              disabled={!/^09\d{9}$/.test(form.watch("mobile"))}
            >
              {t("confirm_and_continue")}
            </ButtonLoading>
          </form>
        </Form>
        <p className="text-muted-foreground text-center text-[13px]">
          {t.rich("terms_and_conditions_message", {
            a: (chunks) => (
              <a
                href="https://befroosh.app/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-secondary"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <Button
          variant="link"
          type="button"
          disabled={isLoading}
          className="text-muted-foreground"
          onClick={() => router.push(SITE_URL || "https://befroosh.app")}
        >
          {t("back")}
          <MoveLeftIcon />
        </Button>
      </div>
    </div>
  );
}

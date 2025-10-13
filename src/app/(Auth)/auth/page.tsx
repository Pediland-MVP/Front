// Refactored
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import {
  Button,
  ButtonLoading,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  LoadingLogo,
  LogoText,
} from "@/components";
import { MoveLeftIcon } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export default function AuthPage() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const t_err = useTranslations("ERROR_CODES");
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = z.object({
    mobile: z.string().regex(/^(?:|0|09|09\d{1,9})$/, {
      message: t("Error.number_should_start_with_09"),
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
    console.log("Form submitted with data:", data);
    console.log("API_URL:", API_URL);

    setIsLoading(true);

    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("prelogin_mobile", data.mobile);
      }

      const response = await axios.get(`${API_URL}/auth/prelogin`, {
        params: {
          mobile: data.mobile,
        },
      });

      const next = response.data?.data?.next;
      console.log("✅ API Response:", response.data?.data);

      if (next === "password") {
        router.push(`/auth/password`);
      }

      if (next === "otp") {
        router.push(`/auth/signin`);
      }
    } catch (error) {
      console.error("❌ API Error:", error);

      if (error?.response?.data?.code === "USER_NOT_FOUND") {
        try {
          const signUp = await axios.post(`${API_URL}/auth/mobile/signUp`, {
            mobile: data.mobile,
          });
          router.push(`/auth/otp`);
        } catch (error) {
          console.error("❌ API Error:", error);
          const message = t_err(error?.code);
          toast.error(message);
        }
      } else if (error?.response?.data?.statusCode === 429) {
        toast.error("بین هر درخواست کد باید 2 دقیقه فاصله باشد.");
        setIsLoading(false);
      } else {
        toast.error(t_err(error?.code));
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <LoadingLogo delay={3000} />

      <div className="flex flex-1 flex-col">
        <div className="mb-12 flex flex-1 items-end justify-center">
          <LogoText />
        </div>

        <div className="space-y-5">
          <div className="text-center text-[15px] font-medium">
            <div>
              {t("for_login_or_register")}
              <br />
              {t("insert_your_mobile_number")}
            </div>
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
            {t("terms_and_conditions_message")}
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <Button
            variant="link"
            type="button"
            className="text-muted-foreground"
            onClick={() => router.push("https://befroosh.app")}
          >
            {t("back")}
            <MoveLeftIcon />
          </Button>
        </div>
      </div>
    </>
  );
}

// Refactored
"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

import {
  Button,
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
import axios from "axios";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export default function AuthPage() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const t_err = useTranslations("ERROR_CODES");

  const formSchema = z.object({
    mobile: z.string().refine((val) => {
      // Allow empty for initial state
      if (val.length === 0) return false;
      // Must be exactly 11 digits starting with 09
      return /^09\d{9}$/.test(val);
    }, t("Error.number_should_start_with_09")),
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
    
    try {
      const response = await axios.get(`${API_URL}/auth/prelogin`, {
        params: {
          mobile: data.mobile,
        },
      });

      console.log("API Response:", response.data);
      const result = response.data;
      if (result?.next === "password") {
        router.push(`/auth/password`);
      }
      if (result?.next === "otp") {
        router.push(`/auth/otp`);
      }
    } catch (error) {
      console.error("API Error:", error);
      if (error?.response?.data?.code === "USER_NOT_FOUND") {
        return router.push(`/auth/register`);
      }
      toast.error(t_err(error?.response?.data?.code));
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
                        name={field.name}
                        value={field.value}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          field.onChange(value);
                          form.trigger("mobile");
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

              <Button
                type="submit"
                className="w-full"
                disabled={!form.formState.isValid || form.formState.isSubmitting}
              >
                {t("confirm_and_continue")}
              </Button>
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
            onClick={() => router.back()}
          >
            {t("back")}
            <MoveLeftIcon />
          </Button>
        </div>
      </div>
    </>
  );
}

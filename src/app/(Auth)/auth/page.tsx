// Refactored
"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

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

export default function AuthPage() {
  const router = useRouter();
  const t = useTranslations("Auth");

  const form = useForm({
    defaultValues: {
      mobile: "",
    },
  });

  const onSubmit = (data: { mobile: string }) => {
    console.log("onSubmit", data);
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
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        className="text-center tracking-widest"
                        maxLength={11}
                        placeholder={t("mobile")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
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

"use client";

import api, { clearAccessToken } from "@/hooks/swr/api-client";
import { useGlobalLoading } from "@/components/Providers/GlobalLoadingProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import useUser from "@/hooks/useUser";

import {
  ButtonLoading,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  LoadingLogo,
} from "@components";
import { UserCirclePlusIcon } from "@phosphor-icons/react";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export default function OnboardingPage() {
  const { user, isLoading, isAuthenticated, mutate } = useUser();
  const { setLoading: setGlobalLoading } = useGlobalLoading();
  const router = useRouter();
  const t = useTranslations("Auth");
  const t_err = useTranslations("Auth.Errors");
  const t_ec = useTranslations("ERROR_CODES");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ----------------------------
  // 1️⃣ Routing Logic (Protected)
  // ----------------------------
  // useEffect(() => {
  //   console.log("user", user);

  //   if (isLoading) return;

  //   // if (!user) return;

  //   if (!isAuthenticated) {
  //     setGlobalLoading(true);
  //     router.replace("/auth");
  //     return;
  //   }

  //   if (user.status !== "onboarding") {
  //     setGlobalLoading(true);
  //     router.replace("/");
  //     return;
  //   }

  //   setGlobalLoading(false);
  // }, [isLoading, isAuthenticated, user, router, setGlobalLoading]);

  // ----------------------------
  // 2️⃣ Schema & Form
  // ----------------------------
  const formSchema = z.object({
    firstname: z.string().min(3, t_err("first_name_length", { length: 3 })),
    lastname: z.string().min(3, t_err("last_name_length", { length: 3 })),
    submittedInstagramUsername: z
      .string()
      .min(3, t_err("instagram_id_length", { length: 3 })),
    referralCode: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      firstname: "",
      lastname: "",
      submittedInstagramUsername: "",
      referralCode: "",
    },
  });

  // ----------------------------
  // 3️⃣ Submit Handler
  // ----------------------------
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await api.post(`${API_URL}/auth/completeOnboarding`, values);
      await mutate(); // refetch user info
      setGlobalLoading(true);
      router.push("/connect");
    } catch (error) {
      console.error("❌ Onboarding error:", error);
      toast.error(t_ec(error.response?.data?.code));
      setIsSubmitting(false);
    }
  };

  // ----------------------------
  // 4️⃣ Cancel Registration (Logout)
  // ----------------------------
  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore error
    } finally {
      clearAccessToken();
      setGlobalLoading(true);
      router.replace("/auth");
    }
  };

  // ----------------------------
  // 5️⃣ Render Control (No Flicker)
  // ----------------------------
  // if (isLoading || !isAuthenticated) {
  //   return <LoadingLogo />;
  // }

  // if (user?.status !== "onboarding") {
  //   return <LoadingLogo />;
  // }

  // ----------------------------
  // 6️⃣ UI
  // ----------------------------
  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mb-12 flex flex-1 items-end justify-center">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <UserCirclePlusIcon size={28} weight="duotone" />
          {t("title_register")}
        </h1>
      </div>

      <div className="space-y-5">
        <div className="flex flex-col text-center text-[15px] font-medium">
          <div>{t("complete_registration_form")}</div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstname"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder={t("first_name")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastname"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder={t("last_name")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="submittedInstagramUsername"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder={t("instagram_id")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referralCode"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder={t("referral_code")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ButtonLoading
              className="w-full"
              disabled={
                isSubmitting ||
                !form.watch("firstname") ||
                !form.watch("lastname") ||
                !form.watch("submittedInstagramUsername") ||
                !form.formState.isValid
              }
              isLoading={isSubmitting}
            >
              {t("confirm_and_continue")}
            </ButtonLoading>
          </form>
        </Form>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <ButtonLoading
          isLoading={isSubmitting}
          onClick={handleCancel}
          variant="link"
          type="button"
          className="text-muted-foreground"
        >
          انصراف از ثبت‌نام
        </ButtonLoading>
      </div>
    </div>
  );
}

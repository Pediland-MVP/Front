"use client";

import api, { useLogout } from "@/hooks/swr/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Switch,
} from "@/components/ui";
import { ButtonLoading } from "@/components/ui-custom/ButtonLoading";
import { UserCirclePlusIcon } from "@phosphor-icons/react";
import SupportButton from "../supportButton";
import { CustomersSlider } from "./customersSlider";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_LANDING_URL;

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations("Auth");
  const t_err = useTranslations("Auth.Errors");
  const t_ec = useTranslations("ERROR_CODES");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showReferralCode, setShowReferralCode] = useState(false);
  const logout = useLogout();

  const formSchema = useMemo(
    () =>
      z.object({
        firstname: z.string().min(3, t_err("first_name_length", { length: 3 })),
        lastname: z.string().min(3, t_err("last_name_length", { length: 3 })),
        submittedInstagramUsername: z
          .string()
          .min(3, t_err("instagram_id_length", { length: 3 })),
        referralCode: showReferralCode
          ? z.string().min(1, t_err("referral_code_required"))
          : z.string().optional(),
      }),
    [showReferralCode, t_err],
  );

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

  // Update form resolver when schema changes
  useEffect(() => {
    form.clearErrors();
    const currentValues = form.getValues();
    form.reset(currentValues, { keepValues: true });
  }, [formSchema, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      await api.post(`${API_URL}/auth/completeOnboarding`, values);
      router.push("/connect");
    } catch (error) {
      console.error("❌ Onboarding error:", error);
      toast.error(t_ec(error.response?.data?.code));
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setIsCanceling(true);

    try {
      await logout();
      router.replace("/auth");
    } catch (error) {
      console.error("❌ Logout error:", error);
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="flex h-lvh w-full flex-col items-center justify-start overflow-x-hidden pt-12">
      <div className="flex max-h-min flex-1 flex-col items-center justify-center sm:max-w-sm">
        <CustomersSlider />
      </div>

      <div className="flex max-h-min flex-1 flex-col justify-center px-10 sm:max-w-sm">
        {/* <div className="mb-2 flex max-h-min flex-1 items-end justify-center">
          <h1 className="flex items-center gap-2 text-lg font-bold">
            <UserCirclePlusIcon size={28} weight="duotone" />
            {t("title_register")}
          </h1>
        </div> */}

        <div className="space-y-5">
          <div className="flex flex-col text-center text-[15px] font-medium mt-3">
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
                      <Input
                        {...field}
                        placeholder={t("first_name")}
                        className="text-center"
                      />
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
                      <Input
                        {...field}
                        placeholder={t("last_name")}
                        className="text-center"
                      />
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
                      <Input
                        {...field}
                        onChange={(e) => {
                          const filteredValue = e.target.value
                            .replace(/[^a-zA-Z0-9_.]/g, "")
                            .toLowerCase();
                          field.onChange(filteredValue);
                        }}
                        placeholder={t("instagram_id")}
                        dir="ltr"
                        className="text-center"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-3">
                <Switch
                  checked={showReferralCode}
                  onCheckedChange={setShowReferralCode}
                />
                <span className="text-primary text-sm">
                  {t("have_referral_code")}
                </span>
              </div>
              {showReferralCode && (
                <FormField
                  control={form.control}
                  name="referralCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("referral_code")}
                          onChange={(e) => {
                            const filteredValue = e.target.value.replace(
                              /[^a-zA-Z0-9_.]/g,
                              "",
                            );
                            field.onChange(filteredValue);
                          }}
                          dir="ltr"
                          className="text-center"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <ButtonLoading
                className="w-full"
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {t("confirm_and_continue")}
              </ButtonLoading>
            </form>
          </Form>
        </div>

        <SupportButton type="external" />
      </div>

      <div className="flex max-h-min flex-1 flex-col items-center justify-center sm:max-w-sm">
        <ButtonLoading
          isLoading={isCanceling}
          disabled={isSubmitting}
          onClick={handleCancel}
          variant="link"
          type="button"
          className="text-muted-foreground"
        >
          {t("cancel_register")}
        </ButtonLoading>
      </div>
    </div>
  );
}

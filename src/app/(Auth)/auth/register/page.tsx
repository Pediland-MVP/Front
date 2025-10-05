// Refactored
"use client";

import { REGEX_MOBILE, REGEX_PASSWORD } from "@/utils/regex";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  LoaderSpin,
} from "@/components";
import { UserCirclePlusIcon } from "@phosphor-icons/react/dist/ssr";
import { MoveLeftIcon } from "lucide-react";

export default function RegisterPage() {
  const t = useTranslations("Auth.Register");
  const t_ec = useTranslations("ERROR_CODES");
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const [isLoading, setIsLoading] = useState(false);
  const [loginWith, setLoginWith] = useState<
    "mobile" | "google" | "facebook"
  >();

  const formSchema = z
    .object({
      firstname: z
        .string({ message: t("firstnameRequired") })
        .min(1, t("enterFirstname")),
      lastname: z
        .string({ message: t("lastnameRequired") })
        .min(1, t("enterLastname")),
      referralCode: z.string({ message: t("referralCodeRequired") }).optional(),
      mobile: z
        .string({ message: t("mobileRequired") })
        .regex(REGEX_MOBILE, t("enterValidMobile"))
        .min(1, t("enterMobile")),
      password: z
        .string({ message: t("passwordRequired") })
        .regex(REGEX_PASSWORD, t("passwordValidation")),
      confirmPassword: z
        .string({ message: t("confirmPasswordRequired") })
        .min(1, t("enterConfirmPassword")),
      acceptRules: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (!data.acceptRules) {
        ctx.addIssue({
          code: "custom",
          path: ["acceptRules"],
          message: t("acceptRules.erros.required"),
        });
      }
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues:
      process.env.NODE_ENV === "development"
        ? {
            firstname: "Test",
            lastname: "TestUser",
            mobile: "09210246947",
            password: "123Sina@",
            confirmPassword: "123Sina@",
            referralCode: "11313",
            acceptRules: true,
          }
        : {
            acceptRules: true,
          },
  });

  const router = useRouter();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoginWith("mobile");
    setIsLoading(true);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/mobile/signUp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      },
    )
      .then(async (res) => {
        const resJson = await res.json();
        if (!res.ok) {
          if (res.status === 409) {
            toast.error(t("mobileAlreadyRegistered"));
            return;
          }

          toast.error(t_ec(resJson.code));
          return;
        }
        router.push("/auth/verify");
      })
      .catch((e) => {
        console.error(e);
        toast.error(t("generalError"));
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mb-12 flex flex-1 items-end justify-center">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <UserCirclePlusIcon size={28} weight="duotone" />
          {t("title")}
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
                <FormItem className="col-span-4 sm:col-span-2">
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="given-name"
                      placeholder={t("enterFirstnamePlaceholder")}
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
                <FormItem className="col-span-4 sm:col-span-2">
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="family-name"
                      placeholder={t("enterLastnamePlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagramId"
              render={({ field }) => (
                <FormItem className="col-span-4">
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
                <FormItem className="col-span-4 sm:col-span-4">
                  <FormControl>
                    <Input {...field} placeholder={t("referral_code")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {t("confirm_and_continue")}
              {isLoading && loginWith === "mobile" && (
                <LoaderSpin className="mr-1" size={20} />
              )}
            </Button>
          </form>
        </Form>
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
  );
}

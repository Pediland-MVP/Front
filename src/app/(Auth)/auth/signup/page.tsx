"use client";

import { LoaderSpin } from "@/components/ui-custom/LoaderSpin";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputPassword } from "@/components/ui/inputPassword";
import { onInputP2EHandler } from "@/utils/p2eNumber";
import { REGEX_MOBILE, REGEX_PASSWORD } from "@/utils/regex";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  UserCirclePlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default function Signup() {
  const t = useTranslations("Auth.Signup");
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
    <main className="_signup h-full bg-blue-50/75">
      <div className="container h-full max-w-6xl px-6 sm:px-0">
        <div className="_wrap relative flex h-full items-center justify-center">
          <div className="_content mx-auto w-full sm:w-1/3">
            <div className="_header mb-6 flex flex-col gap-2">
              <div className="_title flex items-center justify-center gap-2">
                <UserCirclePlusIcon
                  size={36}
                  weight="light"
                  className="text-primary"
                />
                <h1 className="text-primary text-2xl font-semibold">
                  {t("signupTitle")}
                </h1>
              </div>
              <p className="text-center text-sm text-gray-500">
                {t("alreadyHaveAccount")}{" "}
                <Link
                  className="text-secondary font-medium underline underline-offset-8 duration-300"
                  href="/auth/signin"
                >
                  {t("signInHere")}
                </Link>
              </p>
            </div>

            <div className="_form">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="grid grid-cols-4 gap-3"
                >
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
                    name="mobile"
                    render={({ field }) => (
                      <FormItem className="col-span-4">
                        <FormControl>
                          <Input
                            {...field}
                            autoComplete="username"
                            onInput={onInputP2EHandler}
                            placeholder={t("enterMobilePlaceholder")}
                          />
                        </FormControl>
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
                            autoComplete="new-password"
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
                            placeholder={t("enterConfirmPasswordPlaceholder")}
                          />
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
                          <Input
                            {...field}
                            placeholder={t("enterReferralCodePlaceholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <p className="col-span-4">
                    {t.rich("acceptRules.label", {
                      rules: (chunks) => (
                        <Link
                          href={`${process.env.NEXT_PUBLIC_LANDING_URL}/terms`}
                          className="text-blue-500"
                        >
                          {chunks}
                        </Link>
                      ),
                      privacy: (chunks) => (
                        <Link
                          href={`${process.env.NEXT_PUBLIC_LANDING_URL}/privacy`}
                          className="text-blue-500"
                        >
                          {chunks}
                        </Link>
                      ),
                    })}
                  </p>

                  <Button
                    type="submit"
                    className="col-span-4"
                    disabled={isLoading}
                  >
                    {t("signup")}
                    {isLoading && loginWith === "mobile" && (
                      <LoaderSpin className="mr-1" size={20} />
                    )}
                  </Button>
                </form>
              </Form>

              <Button
                variant="link"
                className="text-muted-foreground mt-10 w-full"
                onClick={() => router.push(process.env.NEXT_PUBLIC_LANDING_URL)}
              >
                {t("backToSite")}
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>

              {/* <TextDivider size="lg">{t("orDivider")}</TextDivider> */}

              {/* <div className="w-full grid grid-cols-4 gap-3">
                <Button
                  onClick={signUpWithGoogle}
                  className="col-span-4"
                  variant="outline"
                  disabled={isLoading}
                >
                  {loginWith === "google" && isLoading ? (
                    <LoaderSpin className="ml-1" size={22} />
                  ) : (
                    ""
                  )}
                  {t("continueWithGoogle")}
                </Button>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

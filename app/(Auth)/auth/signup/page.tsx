"use client";

import Link from "next/link";
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastAction } from "@radix-ui/react-toast";
import { REGEX_MOBILE, REGEX_PASSWORD } from "@/app/utils/regex";
import { useTranslations } from "next-intl";
// UI
import LoadingSpinner from "@/components/ui/loadingSpinner";
import TextDivider from "@/components/theme/ui/textDivider";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/theme/ui/input";
import { InputPassword } from "@/components/theme/ui/inputPassword";
import { Button } from "@/components/theme/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { UserCirclePlus } from "@phosphor-icons/react/dist/ssr";

export default function Signup() {
  const t = useTranslations("Auth.Signup");

  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const [isLoading, setIsLoading] = useState(false);
  const [loginWith, setLoginWith] = useState<"mobile" | "google" | "facebook">();

  const formSchema = z.object({
    firstname: z
      .string({ message: t("firstnameRequired") })
      .min(1, t("enterFirstname")),
    lastname: z
      .string({ message: t("lastnameRequired") })
      .min(1, t("enterLastname")),
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
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues:
      process.env.NODE_ENV === "development"
        ? {
          firstname: "Test",
          lastname: "TestUser",
          mobile: "09210246947",
          password: "123Sina@",
          confirmPassword: "123Sina@",
        }
        : undefined,
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
      }
    )
      .then(async (res) => {
        const resJson = await res.json();
        if (!res.ok) {
          if (res.status === 409) {
            toast({
              title: t("signupFailed"),
              description: t("mobileAlreadyRegistered"),
              variant: "destructive",
            });
            return;
          }

          toast({
            title: t("error"),
            description: resJson.message,
            variant: "destructive",
          });
          return;
        }
        router.push("/auth/verify");
      })
      .catch((e) => {
        console.error(e);
        toast({
          title: t("error"),
          description: t("generalError"),
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  };

  const signUpWithGoogle = () => {
    setLoginWith("google");
    setIsLoading(true);
    router.push(`${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/google/login`);
  };

  const signUpWithFacebook = () => {
    setLoginWith("facebook");
    setIsLoading(true);
    router.push(`${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/facebook`);
  };

  return (
    <main className="_signup h-full bg-blue-50/75">
      <div className="container max-w-6xl px-6 sm:px-0 h-full">
        <div className="_wrap flex items-center justify-center h-full">
          <div className="_content w-full sm:w-1/3 mx-auto">
            <div className="_header mb-6 flex flex-col gap-2">
              <div className="_title flex items-center justify-center gap-2">
                <UserCirclePlus
                  size={36}
                  weight="light"
                  className="text-primary"
                />
                <h1 className="text-2xl font-semibold text-primary">
                  {t("signupTitle")}
                </h1>
              </div>
              <p className="text-sm text-gray-500 text-center">
                {t("alreadyHaveAccount")}{" "}
                <Link
                  className="text-gray-500 hover:text-secondary underline underline-offset-8 duration-300"
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

                  <Button
                    type="submit"
                    className="col-span-4"
                    disabled={isLoading}
                  >
                    {t("signup")}
                    {isLoading && loginWith === "mobile" && (
                      <LoadingSpinner className="mr-1" size={20} />
                    )}
                  </Button>
                </form>
              </Form>

              {/* <TextDivider size="lg">{t("orDivider")}</TextDivider> */}

              {/* <div className="w-full grid grid-cols-4 gap-3">
                <Button
                  onClick={signUpWithGoogle}
                  className="col-span-4"
                  variant="outline"
                  disabled={isLoading}
                >
                  {loginWith === "google" && isLoading ? (
                    <LoadingSpinner className="ml-1" size={22} />
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


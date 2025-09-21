"use client";

import { LoaderSpin } from "@befroosh/ui-custom";
import { Button } from "@befroosh/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@befroosh/ui";
import { Input } from "@befroosh/ui";
import { InputPassword } from "@befroosh/ui";
import { onInputP2EHandler } from "@/utils/p2eNumber";
import { REGEX_PASSWORD } from "@/utils/regex";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, KeyholeIcon } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default function SignIn() {
  const t = useTranslations("Auth.Signin");

  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const [isLoading, setIsLoading] = useState(false);
  const [loginWith, setLoginWith] = useState<"mobile" | "google">();

  const formSchema = z.object({
    emailOrMobile: z
      .string({ message: t("mobileRequired") })
      .min(1, t("enterMobile")),
    password: z
      .string({ message: t("passwordRequired") })
      .regex(REGEX_PASSWORD, t("passwordValidation")),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues:
      process.env.NODE_ENV === "development"
        ? { emailOrMobile: "09210246947", password: "123Sina@" }
        : undefined,
  });

  const router = useRouter();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoginWith("mobile");
    setIsLoading(true);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/mobile/signIn`,
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
        if (!res.ok) {
          toast.error(t("loginError"));
          return;
        }
        toast.success(t("loginSuccess"));
        router.push("/");
      })
      .catch((e) => {
        console.error(e);
        toast.error(t("loginError"));
      })
      .finally(() => setIsLoading(false));
  };

  const loginWithGoogle = () => {
    setLoginWith("google");
    setIsLoading(true);
    router.push(`${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/google/login`);
  };

  return (
    <main className="_signin-page h-full bg-blue-50/75">
      <div className="container h-full max-w-6xl px-6 sm:px-0">
        <div className="_wrapper relative flex h-full items-center justify-center">
          <div className="_content mx-auto w-full sm:w-1/3">
            <div className="_header mb-6 flex flex-col gap-2">
              <div className="_title flex items-center justify-center gap-2">
                <KeyholeIcon
                  size={36}
                  weight="light"
                  className="text-primary"
                />
                <h1 className="text-primary text-2xl font-semibold">
                  {t("loginTitle")}
                </h1>
              </div>
              <p className="text-center text-sm text-gray-500">
                {t("noAccount")}{" "}
                <Link
                  className="text-secondary font-medium underline underline-offset-8 duration-300"
                  href="/auth/signup"
                >
                  {t("signUpHere")}
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
                    name="emailOrMobile"
                    render={({ field }) => (
                      <FormItem className="col-span-4">
                        <FormControl>
                          <Input
                            autoComplete="username"
                            placeholder={t("enterMobilePlaceholder")}
                            onInput={onInputP2EHandler}
                            {...field}
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
                            autoComplete="current-password"
                            placeholder={t("enterPasswordPlaceholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="col-span-4 flex">
                    <Link
                      href={"/auth/resetPassword"}
                      className="text-muted-foreground hover:text-secondary py-1 text-sm duration-300"
                    >
                      {t("forgotPassword")}
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    className="col-span-4 text-white"
                    color="success"
                    disabled={isLoading}
                  >
                    {t("login")}
                    {loginWith === "mobile" && isLoading ? (
                      <LoadingSpinner className="mr-1" size={20} />
                    ) : null}
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
                  onClick={loginWithGoogle}
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

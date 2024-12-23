"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { REGEX_PASSWORD } from "@/app/utils/regex";
import { useRouter } from "next/navigation";
import { Button } from "@/components/theme/ui/button";
import { Input } from "@/components/theme/ui/input";
import TextDivider from "@/components/theme/ui/textDivider";
// UI 
import { toast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Keyhole } from "@phosphor-icons/react/dist/ssr";
import { InputPassword } from "@/components/theme/ui/inputPassword";
import { useTranslations } from "next-intl";

export default function Login() {
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
      }
    )
      .then(async (res) => {
        if (!res.ok) {
          toast({
            title: t("loginError"),
            description: t("loginErrorDescription"),
            variant: "destructive",
          });
          return;
        }
        toast({
          title: t("loginSuccess"),
          description: t("loginWelcome"),
        });
        router.push("/console");
      })
      .catch((e) => {
        console.error(e);
        toast({
          title: t("loginError"),
          description: t("generalError"),
          variant: "destructive",
        });
      })
      .finally(() => setIsLoading(false));
  };

  const loginWithGoogle = () => {
    setLoginWith("google");
    setIsLoading(true);
    router.push(`${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/google/login`);
  };

  return (
    <main className="_signin h-full bg-fuchsia-50/75">
      <div className="container max-w-6xl px-6 sm:px-0 h-full">
        <div className="_wrap flex items-center justify-center h-full">
          <div className="_content text-center w-full sm:w-1/3 mx-auto">
            <div className="_header mb-6 flex flex-col gap-2">
              <div className="_title flex items-center justify-center gap-2">
                <Keyhole size={36} weight="light" className="text-primary" />
                <h1 className="text-2xl font-semibold text-primary">
                  {t("loginTitle")}
                </h1>
              </div>
              <p className="text-sm text-gray-500 text-center">
                {t("noAccount")}{" "}
                <Link
                  className="text-gray-500 hover:text-secondary hover:underline underline-offset-8 duration-300"
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
                            placeholder={t("enterMobilePlaceholder")}
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
                            placeholder={t("enterPasswordPlaceholder")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex col-span-4">
                    <Link
                      href={"/auth/resetPassword"}
                      className="py-1 text-sm text-gray-400 hover:text-secondary duration-300"
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

              <TextDivider size="lg">{t("orDivider")}</TextDivider>

              <div className="w-full grid grid-cols-4 gap-3">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


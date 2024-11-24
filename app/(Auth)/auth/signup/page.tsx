"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@radix-ui/react-toast";
import { REGEX_MOBILE, REGEX_PASSWORD } from "@/app/utils/regex";
import { useTranslations } from 'next-intl';

import LoadingSpinner from "@/components/ui/loadingSpinner";
import TextDivider from "@/components/theme/ui/textDivider";
import { Input } from "@/components/theme/ui/input";
import { InputPassword } from "@/components/theme/ui/inputPassword";
import { Button } from "@/components/theme/ui/button";
import { UserCirclePlus } from "@phosphor-icons/react/dist/ssr";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

export default function Signup() {
  const t = useTranslations('Signup');
  const [isLoading, setIsLoading] = useState(false);
  const [loginWith, setLoginWith] = useState<"mobile" | "google">();

  const formSchema = z.object({
    firstname: z
      .string({ required_error: t('errors.firstNameRequired') })
      .min(1, t('errors.firstNameEnter')),
    lastname: z
      .string({ required_error: t('errors.lastNameRequired') })
      .min(1, t('errors.lastNameEnter')),
    mobile: z
      .string({ required_error: t('errors.mobileRequired') })
      .regex(REGEX_MOBILE, t('errors.mobileInvalid'))
      .min(1, t('errors.mobileEnter')),
    password: z
      .string({ required_error: t('errors.passwordRequired') })
      .regex(REGEX_PASSWORD, t('errors.passwordRequirements')),
    confirmPassword: z
      .string({ required_error: t('errors.confirmPasswordRequired') })
      .min(1, t('errors.confirmPasswordEnter')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('errors.passwordMismatch'),
    path: ['confirmPassword'],
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
    try {
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
      );

      const resJson = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast({
            title: t('toasts.pleaseLogin'),
            description: t('toasts.mobileAlreadyRegistered'),
            variant: "destructive",
            action: (
              <ToastAction
                altText={t('toasts.login')}
                onClick={() => router.push("/auth/signin")}
              >
                {t('toasts.login')}
              </ToastAction>
            ),
          });
          return;
        }

        toast({
          title: t('toasts.error'),
          description: resJson.message,
          variant: "destructive",
        });
        return;
      }

      router.push("/auth/verify");
    } catch (e) {
      console.error(e);
      toast({
        title: t('toasts.error'),
        description: t('toasts.generalError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithGoogle = () => {
    setLoginWith("google");
    setIsLoading(true);
    router.push(`${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/google/login`);
  };

  return (
    <main className="_signup h-full bg-fuchsia-50/75">
      <div className="container max-w-6xl px-6 sm:px-0 h-full">
        <div className="_wrap flex items-center justify-center h-full">
          <div className="_content w-full sm:w-1/3 mx-auto">
            <div className="_header mb-6 flex flex-col gap-2">
              <div className="_title flex items-center justify-center gap-2">
                <UserCirclePlus size={36} weight="light" className="text-primary" />
                <h1 className="text-2xl font-semibold text-primary">{t('title')}</h1>
              </div>
              <p className="text-sm text-gray-500 text-center">
                {t('haveAccount')}{" "}
                <Link
                  className="text-gray-500 hover:text-secondary hover:underline underline-offset-8 duration-300"
                  href="/auth/signin"
                >
                  {t('loginLink')}
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
                          <Input {...field} placeholder={t('placeholders.firstName')} />
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
                          <Input {...field} placeholder={t('placeholders.lastName')} />
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
                          <Input {...field} placeholder={t('placeholders.mobileNumber')} />
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
                          <InputPassword {...field} placeholder={t('placeholders.password')} />
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
                            placeholder={t('placeholders.confirmPassword')}
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
                    {t('signupButton')}
                    {isLoading && loginWith === "mobile" && (
                      <LoadingSpinner className="mr-1" size={20} />
                    )}
                  </Button>
                </form>
              </Form>

              <TextDivider size="lg">{t('or')}</TextDivider>

              <div className="w-full grid grid-cols-4 gap-3">
                <Button
                  onClick={signUpWithGoogle}
                  className="col-span-2"
                  variant="outline"
                  disabled={isLoading}
                >
                  {loginWith === "google" && isLoading ? (
                    <LoadingSpinner className="ml-1" size={22} />
                  ) : (
                    ""
                  )}
                  {t('continueWithFacebook')}
                </Button>
                <Button
                  onClick={signUpWithGoogle}
                  className="col-span-2"
                  variant="outline"
                  disabled={isLoading}
                >
                  {loginWith === "google" && isLoading ? (
                    <LoadingSpinner className="ml-1" size={22} />
                  ) : (
                    ""
                  )}
                  {t('continueWithGoogle')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


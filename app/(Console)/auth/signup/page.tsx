"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from "@/components/ui/use-toast";
import LoadingSpinner from '@/components/ui/loadingSpinner';
import AuthHeader from "../components/auth.header";
import TextDivider from "@/components/ui/textDivider";
import { Eye, EyeSlash, GoogleLogo } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { REGEX_MOBILE } from "@/app/utils/regex";

export default function Signup() {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const [isLoading, setIsLoading] = useState(false);
  const [loginWith, setLoginWith] = useState<'mobile' | 'google'>();

  const formSchema = z.object({
    firstName: z.string({ message: 'نام الزامیست' }).min(1, "نام را وارد کنید"),
    lastName: z.string({ message: 'نام خانوادگی الزامیست' }).min(1, "نام خانوادگی را وارد کنید"),
    mobileNumber: z.string({ message: 'شماره همراه الزامیست' }).min(1, "شماره همراه را وارد کنید"),
    password: z.string({ message: 'پسورد الزامیست' }).regex(REGEX_MOBILE, 'پسورد باید حداقل ۸ کاراکتر و شامل یک عدد و یک حرف انگلیسی بزرگ باشد'),
    confirmPassword: z.string({ message: 'تکرار پسورد الزامیست' }).min(1, "تکرار پسورد را وارد کنید")
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
  });

  const router = useRouter();

  const onSubmit = async (values: any) => {
    setLoginWith('mobile');
    setIsLoading(true);
    // Placeholder for API call
    toast({ title: 'ثبت نام با موفقیت انجام شد', description: 'به حساب کاربری خود خوش آمدید', });
    router.push('/console');
    setIsLoading(false);
  };

  const signUpWithGoogle = () => {
    setLoginWith('google');
    setIsLoading(true);
    // Placeholder for Google sign-in redirect
    router.push('/auth/google/signup');
    setIsLoading(false);
  };

  return (
    <main className="_signup pt-14 sm:pt-0 h-full relative">
      <AuthHeader />
      <div className="container max-w-6xl flex items-center justify-center h-full">
        <div className="text-center w-full sm:w-1/3 mx-auto px-3 sm:px-0">
          <div className="_heading flex items-center justify-center gap-2 mb-6">
            <GoogleLogo size={32} />
            <h1 className="text-xl font-semibold">ثبت نام کاربر جدید</h1>
          </div>
          <div className="_form">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <Input
                {...form.register("firstName")}
                placeholder="نام"
                className="col-span-4"
              />
              <Input
                {...form.register("lastName")}
                placeholder="نام خانوادگی"
                className="col-span-4"
              />
              <Input
                {...form.register("mobileNumber")}
                placeholder="شماره همراه"
                className="col-span-4"
              />
              <Input
                type={isVisible ? "text" : "password"}
                {...form.register("password")}
                placeholder="رمز عبور"
                endContent={
                  <button
                    className="focus:outline-none flex justify-center items-center"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {isVisible ? (
                      <Eye size={22} className="text-gray-400" />
                    ) : (
                      <EyeSlash size={22} className="text-gray-400" />
                    )}
                  </button>
                }
                className="col-span-4"
              />
              <Input
                type={isVisible ? "text" : "password"}
                {...form.register("confirmPassword")}
                placeholder="تکرار رمز عبور"
                endContent={
                  <button
                    className="focus:outline-none flex justify-center items-center"
                    type="button"
                    onClick={toggleVisibility}
                  >
                    {isVisible ? (
                      <Eye size={22} className="text-gray-400" />
                    ) : (
                      <EyeSlash size={22} className="text-gray-400" />
                    )}
                  </button>
                }
                className="col-span-4"
              />
              <Button
                type="submit"
                className="w-full text-white"
                color="success"
                disabled={isLoading}
              >
                ثبت نام
                {isLoading && <LoadingSpinner className="mr-1" size={20} />}
              </Button>
              <TextDivider size="lg"><p>یا با گوگل وارد شوید</p></TextDivider>
              <Button
                onClick={signUpWithGoogle}
                className="w-full"
                color="primary"
                size="lg"
                variant={'outline'}
                disabled={isLoading}
              >
                ثبت نام با اکانت گوگل
                {isLoading && <LoadingSpinner className="mr-1" size={20} />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

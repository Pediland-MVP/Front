"use client";
import React, { useState } from "react";

import { Eye, EyeSlash, GoogleLogo, Lock, Spinner } from "@phosphor-icons/react";
// import AuthHeader from "../layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { REGEX_MOBILE } from "@/app/utils/regex";
import {zodResolver} from '@hookform/resolvers/zod'
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import LoadingSpinner from '@/components/ui/loadingSpinner';
import AuthHeader from "../components/auth.header";

export default function Login() {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const [isLoading, setIsLoading] = useState(false)

  const formSchema = z.object({
    emailOrMobile: z.string({message: 'شماره همراه الزامیست'}).min(1, "شماره همراه را وارد کنید"),
    password: z.string({message: 'پسورد الزامیست'}).regex(REGEX_MOBILE, 'پسورد باید حداقل ۸ کاراکتر و شامل یک عدد و یک حرف انگلیسی بزرگ باشد')
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: process.env.NODE_ENV === 'development' ? {emailOrMobile: '09210246947', password: '123Sina@'} : undefined
  });

  const router = useRouter()

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/mobile/signIn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })
    .then(async res => {
      if (!res.ok) {
        toast({
          title: 'خطا',
          description: 'شماره همراه یا پسورد اشتباه است',
          variant: 'destructive',
        })
        return;
      }
      toast({
        title: 'با موفقیت وارد شدید',
        description: 'به حساب کاربری خود خوش آمدید',
      })
      router.push('/console')
    })
    .catch(e => {
      console.error(e);
      toast({
        title: 'خطا',
        description: 'خطایی رخ داده است',
        variant: 'destructive',
      })
    })
    .finally(() => setIsLoading(false))
    
  }

  return (
    <main className="_login pt-14 sm:pt-0 h-full relative">
      <AuthHeader/>

      <div className="container max-w-6xl flex items-center justify-center h-full">
        <div className="text-center w-full sm:w-1/3 mx-auto px-3 sm:px-0">
          <div className="_heading flex items-center justify-center gap-2 mb-6">
            <Lock size={32} />
            <h1 className="text-xl font-semibold">ورود به حساب کاربری</h1>
          </div>
          <div className="_form">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mb-5 space-y-2"
              >
                <FormField
                  control={form.control}
                  name="emailOrMobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          className="col-span-4"
                          placeholder="شماره همراه"
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
                    <FormItem>
                      <FormControl>
                        <Input
                          className="col-span-4"
                          placeholder="رمز عبور"
                          type={isVisible ? "text" : "password"}
                          startContent={
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
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex col-span-4">
                  <Link
                    href={"/auth/reset"}
                    className="col-span-4 text-sm text-gray-400 hover:text-gray-700 font-light duration-300"
                  >
                    رمز عبورم را فراموش کردم.
                  </Link>
                </div>
                <Button
                  type="submit"
                  className="w-full text-white"
                  color="success"
                  disabled={isLoading}
                >
                  ورود با شماره همراه
                  {
                    isLoading ? <LoadingSpinner className="mr-1" size={20}/> : null
                  }
                </Button>
              </form>
            </Form>

            {/* <Divider className="my-6 bg-gray-100" /> */}
            <Button
              className="pr-4"
              color="primary"
              size="lg"
              disabled={isLoading}
            >
              ورود با اکانت گوگل
              <GoogleLogo weight="bold" size={20} className="mr-1" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

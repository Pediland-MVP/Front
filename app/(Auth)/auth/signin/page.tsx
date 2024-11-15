"use client";
import { useState } from "react";

import { Eye, EyeSlash, FacebookLogo, GoogleLogo } from "@phosphor-icons/react";
// import AuthHeader from "../layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { REGEX_PASSWORD } from "@/app/utils/regex";
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import LoadingSpinner from '@/components/ui/loadingSpinner';
import TextDivider from "@/components/ui/textDivider";

export default function Login() {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const [isLoading, setIsLoading] = useState(false)
  const [loginWith, setLoginWith] = useState<'mobile' | 'google'>()

  const formSchema = z.object({
    emailOrMobile: z.string({ message: 'شماره همراه الزامیست' }).min(1, "شماره همراه را وارد کنید"),
    password: z.string({ message: 'پسورد الزامیست' }).regex(REGEX_PASSWORD, 'پسورد باید حداقل ۸ کاراکتر و شامل یک عدد و یک حرف انگلیسی بزرگ باشد')
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: process.env.NODE_ENV === 'development' ? { emailOrMobile: '09210246947', password: '123Sina@' } : undefined
  });

  const router = useRouter()

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoginWith('mobile')
    setIsLoading(true)
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/mobile/signIn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include',
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

  const loginWithGoogle = () => {
    setLoginWith('google')
    setIsLoading(true)
    router.push(`${process.env.NEXT_PUBLIC_BACK_API_URL}/auth/google/login`)
  }

  return (
    <main className="_signin h-full">
      <div className="container max-w-6xl px-6 sm:px-0 h-full">
        <div className="_wrap flex items-center justify-center h-full">
          <div className="_content text-center w-full sm:w-1/3 mx-auto">
            <div className="_header mb-6 flex flex-col gap-2">
              <h1 className="text-2xl font-semibold">ورود به حساب کاربری</h1>
              <p className="text-sm text-gray-400">حساب کاربری ندارید؟ <Link className="text-gray-400 hover:text-black" href='/auth/signup'>از اینجا ثبت نام کنید</Link></p>
            </div>
            <div className="_form">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="grid grid-cols-4 gap-2"
                >
                  <FormField
                    control={form.control}
                    name="emailOrMobile"
                    render={({ field }) => (
                      <FormItem className="col-span-4">
                        <FormControl>
                          <Input
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
                      <FormItem className="col-span-4">
                        <FormControl>
                          <Input
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
                      href={"/auth/resetPassword"}
                      className="py-1 text-sm text-gray-400 hover:text-gray-700 font-light duration-300"
                    >
                      رمز عبورم را فراموش کردم.
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    className="col-span-4 text-white"
                    color="success"
                    disabled={isLoading}
                  >
                    ورود با شماره همراه
                    {
                      loginWith === 'mobile' && isLoading ? <LoadingSpinner className="mr-1" size={20} /> : null
                    }
                  </Button>
                </form>
              </Form>

              <TextDivider size="lg">یا</TextDivider>

              <div className="w-full">
                <Button
                  onClick={loginWithGoogle}
                  className="col-span-2"
                  variant="outline"
                  disabled={isLoading}
                >
                  {
                    loginWith === 'google' && isLoading ? <LoadingSpinner className="ml-1" size={22} /> : ""}
                  ادامه با اکانت گوگل
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// src/app/(auth)/login/login-form.tsx
'use client';

import { signIn } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

// UI Imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { mutate } from 'swr';
import { useState } from 'react';

const FormSchema = z.object({
  username: z.string().min(10, { message: '' }),
  password: z.string().min(6),
});

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    setIsLoggingIn(true);

    try {
      await signIn(values);
      await mutate('/auth/me'); // ✅ همین‌جا
      toast.success('ورود با موفقیت انجام شد.');
      router.push('/customers');
    } catch (err) {
      console.log(err);
      toast.error('نام کاربری یا رمز عبور اشتباه است.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={cn('flex w-full flex-col gap-6 md:max-w-[340px]', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>پورتال مدیریت بفروش</CardTitle>
          <CardDescription className="text-[13px]">
            لطفا با اطلاعات شخصی خود وارد شوید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام کاربری</FormLabel>
                    <FormControl>
                      <Input
                        dir="ltr"
                        className="text-center text-[15px]"
                        autoComplete="username"
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
                    <FormLabel>رمز عبور</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        dir="ltr"
                        autoComplete="current-password"
                        className="text-center text-[15px]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? 'در حال ورود...' : 'ورود به پورتال'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

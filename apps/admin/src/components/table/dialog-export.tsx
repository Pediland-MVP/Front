"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DownloadIcon } from "lucide-react";

// UI Imports
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";

// Form schema
const exportSchema = z.object({
  startDate: z.date().refine((date) => date !== undefined, {
    message: "تاریخ شروع الزامی است",
  }),
  endDate: z.date().refine((date) => date !== undefined, {
    message: "تاریخ پایان الزامی است",
  }),
  email: z.string().email({
    message: "ایمیل معتبر وارد کنید",
  }),
  count: z
    .number()
    .min(1, {
      message: "تعداد باید حداقل 1 باشد",
    })
    .max(10000, {
      message: "تعداد حداکثر 10000 می‌تواند باشد",
    }),
});

type ExportFormValues = z.infer<typeof exportSchema>;

interface ExportDialogProps {
  title: string;
  description: string;
  onExport: (data: ExportFormValues) => Promise<void>;
  trigger?: React.ReactNode;
  size?: "default" | "sm";
}

export function ExportDialog({
  title,
  description,
  onExport,
  trigger,
  size = "default",
}: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      email: "",
      count: 1000,
    },
  });

  const onSubmit = async (data: ExportFormValues) => {
    setIsSubmitting(true);
    try {
      await onExport(data);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size={size}>
            <DownloadIcon />
            خروجی اکسل
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>تاریخ شروع</FormLabel>
                    <DatePicker buttonClassName="w-full" onChange={field.onChange} date={field.value} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>تاریخ پایان</FormLabel>
                    <DatePicker buttonClassName="w-full" onChange={field.onChange} date={field.value} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ایمیل</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تعداد رکوردها</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1000"
                      {...field}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "در حال ارسال..." : "ارسال خروجی"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

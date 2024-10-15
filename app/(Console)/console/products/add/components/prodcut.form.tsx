"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { FileUpload } from "@/components/file-upload";
import axios from "axios";
import { UploadNamespace } from "@/types/upload";
import { useRouter } from "next/navigation";
import LoadingButton from "@/components/ui/loading-button";

const formSchema = z.object({
  title: z
    .string({
      message: "تایتل ضروری است",
    })
    .min(1, {
      message: "تایتل ضروری است",
    }),
  price: z
    .number({
      message: "قیمت نمیتواند کمتر از صفر باشد",
    })
    .min(0, {
      message: "قیمت نمیتواند کمتر از صفر باشد",
    }),
  description: z
    .string({
      message: "توضیحات باید حداقل ۵ کاراکتر باشد",
    })
    .min(5, {
      message: "توضیحات باید حداقل ۵ کاراکتر باشد",
    }),
  imageId: z
    .number({ message: "تصویر محصول را آپلود کنید" })
    .min(1, "تصویر محصول را آپلود کنید"),
});

export default function ProductForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (form.formState?.errors?.imageId) {
      toast({
        title: "تصویر محصول را آپلود کنید",
        variant: "destructive",
      });
    }
  }, [form.formState.errors]);

  const router = useRouter();

  const [isLoading, setLoading] = useState(false);
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/products`,
        {
          method: "POST",
          body: JSON.stringify(values),
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        toast({
          title: "خطایی رخ داد",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "محصول با موفقیت اضافه شد",
      });

      router.push("/console/products");
    } catch (error) {
      toast({
        title: "اتصال خود را چک کنید",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const handleFileUpload = async (files: File[]) => {
    const file = files[0];
    const formData = new FormData();
    formData.append("image", file);

    const controller = new AbortController();
    const signal = controller.signal;

    try {
      const response = await axios.post<UploadNamespace.POST["Image"]>(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/upload/image`,
        formData,
        {
          signal,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              console.log(`Upload Progress: ${percentCompleted}%`);
              setUploadProgress(percentCompleted);
            } else {
              console.log(`Loaded ${progressEvent.loaded} bytes`);
            }
          },
          withCredentials: true,
        }
      );

      form.setValue("imageId", response.data.id);
      setImages([response.data.url]);
      setUploadProgress(null);
    } catch (error) {
      setUploadProgress(null);
      console.error(error);
    }
    console.log(files);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1 p-6">
        <h2 className="text-2xl font-bold mb-4">جزئیات محصول</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان</FormLabel>
                  <FormControl>
                    <Input placeholder="عنوان محصول" {...field} />
                  </FormControl>
                  <FormDescription>
                    عنوان محصول خود را وارد کنید.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>قیمت</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="۰.۰۰"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    قیمت محصول خود را وارد کنید.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>توضیحات</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="محصول خود را توصیف کنید..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    توضیحات دقیقی از محصول خود ارائه دهید.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LoadingButton isLoading={isLoading} type="submit">ثبت</LoadingButton>
          </form>
        </Form>
      </div>
      <div className="flex-1 p-6">
        <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
          <FileUpload
            images={images}
            accept="image/*"
            onChange={handleFileUpload}
          />
        </div>
      </div>
    </div>
  );
}

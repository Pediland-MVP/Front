"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import DateObject from "react-date-object";
import persian_fa from "react-date-object/locales/persian_fa";
import useSWRImmutable from "swr/immutable";
import { ContactNamespace } from "@/types/contact";
import { fetcher } from "@/hooks/swr/fetcher";
import { toast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import ContactSkeleton from "./contactSkeleton";

export type ContactFormProps = {
    contactId: string
    open: boolean
    setOpen: (open: boolean) => void;

}


const UpdateContactSchema = z.object({
    firstname: z.string().optional().nullable(),
    lastname: z.string().optional().nullable(),
    mobile: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    gender: z.string().optional().nullable(),
    birthDate: z.string().optional().nullable(),
  });
  
  type UpdateContactFormData = z.infer<typeof UpdateContactSchema>;
  
export default function ContactForm({ contactId, open, setOpen }: ContactFormProps) {

  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

    const [contact, setContact] = useState<ContactNamespace.Contact | null>(null);
    const [contactError, setContactError] = useState<Error | null>(null);
    const [isContactLoading, setIsContactLoading] = useState(true);

    const fetchContact = async () => {
      setIsContactLoading(true);
      setContact(null);
      setContactError(null);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACK_API_URL}/contacts/${contactId}`,
          {
            credentials: 'include'
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch contact");
        }

        const data = (await response.json()) as ContactNamespace.Contact;
        setContact(data);
      } catch (error) {
        setContactError(error as Error);
      } finally {
        setIsContactLoading(false);
      }
    };
    
      const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        ...form
      } = useForm<UpdateContactFormData>({
        resolver: zodResolver(UpdateContactSchema),
      });
    
      useEffect(() => {
        fetchContact();
        return () => {
            setContact(null)
            form.reset()
        }
      }, []);
    
    //   useEffect(() => {
    //     console.log('Contact', form.getValues());
    //   }, [form.watch()]);
    
      useEffect(() => {
        if (!contact || open === false || isContactLoading)
          return;
        console.log("Data Set");
        form.reset({
          ...contact,
          ...(contact.birthDate && {
            birthDate: new Date(contact.birthDate).getTime().toString(),
          }),
        });
      }, [contact]);
    
      const onDateChange = (e: any) => {
        console.log(e);
      };
    
      const onSubmit = async (values: UpdateContactFormData) => {
        setIsSubmitLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACK_API_URL}/contacts/${contactId}`,
          {
            method: "PUT",
            body: JSON.stringify(values),
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        setIsSubmitLoading(false);
        if (!response.ok) {
          toast({
            title: "خطا در آپدیت اطلاعات",
          });
          return;
        }
        toast({
          title: "آپدیت شد",
        });
        setOpen(false);
      };
    
    if (isContactLoading || !contact) {
        return (<ContactSkeleton/>)
    }

    return(
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex justify-center items-center gap-x-2 flex-col md:flex-row">
        <div>
          <Label htmlFor="firstname" className="text-right">
            نام
          </Label>
          <Input
            id="firstname"
            {...register("firstname")}
            className="col-span-3"
          />
          {errors.firstname && (
            <p className="col-span-4 text-sm text-red-500">
              {errors.firstname.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="lastname" className="text-right">
            نام خانوادگی
          </Label>
          <Input
            id="lastname"
            {...register("lastname")}
            className="col-span-3"
          />
          {errors.lastname && (
            <p className="col-span-4 text-sm text-red-500">
              {errors.lastname.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center items-center gap-x-2 flex-col md:flex-row">
        <div>
          <Label htmlFor="mobile" className="text-right">
            موبایل
          </Label>
          <Input id="mobile" {...register("mobile")} className="col-span-3" />
          {errors.mobile && (
            <p className="col-span-4 text-sm text-red-500">
              {errors.mobile.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="email" className="text-right">
            ایمیل
          </Label>
          <Input id="email" {...register("email")} className="col-span-3" />
          {errors.email && (
            <p className="col-span-4 text-sm text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-center items-center gap-x-2 flex-col md:flex-row">
        <div>
          <Label htmlFor="country" className="text-right">
            کشور
          </Label>
          <Input id="country" {...register("country")} className="col-span-3" />
          {errors.country && (
            <p className="col-span-4 text-sm text-red-500">
              {errors.country.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="city" className="text-right">
            شهر
          </Label>
          <Input id="city" {...register("city")} className="col-span-3" />
          {errors.city && (
            <p className="col-span-4 text-sm text-red-500">
              {errors.city.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center items-center gap-x-2 flex-col md:flex-row">
        <div className="w-full">
          <Label htmlFor="gender" className="text-right">
            جنسیت
          </Label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => {
                console.log('gender', field.value, typeof field.value, field.value === '');
                if (field.value === undefined) {
                    return <></>
                }
              return (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value!}
                value={field.value!}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="انتخاب جنسیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">مرد</SelectItem>
                  <SelectItem value="female">زن</SelectItem>
                  <SelectItem value="other">سایر</SelectItem>
                </SelectContent>
              </Select>
            )}}
          />
          {errors.gender && (
            <p className="col-span-4 text-sm text-red-500">
              {errors.gender.message}
            </p>
          )}
        </div>
        <div className="w-full">
          <Label htmlFor="birthDate" className="text-right">
            تاریخ تولد
          </Label>
          <Controller
            control={control}
            name="birthDate"
            rules={{ required: true }} //optional
            render={({
              field: { onChange, name, value },
              fieldState: { invalid, isDirty }, //optional
              formState: { errors }, //optional, but necessary if you want to show an error message
            }) => (
              <>
                <DatePicker
                  value={
                    value
                      ? new DateObject(+value)
                          .setLocale(persian_fa)
                          .setCalendar(persian)
                          .format("YYYY/MM/DD")
                      : ""
                  }
                  onChange={(date) => {
                    onChange(
                      date?.isValid ? (date.unix * 1000).toString() : ""
                    );
                  }}
                  format={"YYYY/MM/DD"}
                  calendar={persian}
                  locale={persian_fa}
                  render={<Input name="birthDate" />}
                />
                {errors && errors[name] && errors[name].type === "required" && (
                  //if you want to show an error message
                  <span>your error message !</span>
                )}
              </>
            )}
          />
          {errors.birthDate && (
            <p className="col-span-4 text-sm text-red-500">
              {errors.birthDate.message}
            </p>
          )}
        </div>
      </div>
      <Button type="submit" className="w-full">
        ذخیره تغییرات
        {isSubmitLoading && <LoadingSpinner className="mr-1" size={20} />}
      </Button>
    </form>
  )};
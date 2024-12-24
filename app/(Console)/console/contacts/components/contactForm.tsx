"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { ContactNamespace } from "@/types/contact";
import { toast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import ContactSkeleton from "./contactSkeleton";
import { useTranslations } from "next-intl";

export type ContactFormProps = {
  contactId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const UpdateContactSchema = z.object({
  firstname: z.string().optional().nullable(),
  lastname: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  postalcode: z.string().optional().nullable(), // added postalcode
  address: z.string().optional().nullable(), // added address
});

type UpdateContactFormData = z.infer<typeof UpdateContactSchema>;

export default function ContactForm({
  contactId,
  open,
  setOpen,
}: ContactFormProps) {
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  const [contact, setContact] = useState<ContactNamespace.Contact | null>(null);
  const [contactError, setContactError] = useState<Error | null>(null);
  const [isContactLoading, setIsContactLoading] = useState(true);

  const t = useTranslations('Contacts.Form')


  const fetchContact = async () => {
    setIsContactLoading(true);
    setContact(null);
    setContactError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACK_API_URL}/contacts/${contactId}`,
        {
          credentials: "include",
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
      setContact(null);
      form.reset();
    };
  }, []);

  //   useEffect(() => {
  //     console.log('Contact', form.getValues());
  //   }, [form.watch()]);

  useEffect(() => {
    if (!contact || open === false || isContactLoading) return;
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
        title: t('errors.update'),
      });
      return;
    }
    toast({
      title: t('updated'),
    });
    setOpen(false);
  };


  if (isContactLoading || !contact) {
    return <ContactSkeleton />;
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-2">
          <Label htmlFor="firstname" className="text-right">
            {t('firstname')}
          </Label>
          <Input
            id="firstname"
            {...register("firstname")}
            className="col-span-3"
          />
          {errors.firstname && (
            <p className="col-span-4 text-sm text-red-500">
              {t('errors.firstname')}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="lastname" className="text-right">
            {t('lastname')}
          </Label>
          <Input
            id="lastname"
            {...register("lastname")}
            className="col-span-3"
          />
          {errors.lastname && (
            <p className="col-span-4 text-sm text-red-500">
              {t('errors.lastname')}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="mobile" className="text-right">
            {t('mobile')}
          </Label>
          <Input id="mobile" {...register("mobile")} className="col-span-3" />
          {errors.mobile && (
            <p className="col-span-4 text-sm text-red-500">
              {t('errors.mobile')}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="email" className="text-right">
            {t('email')}
          </Label>
          <Input id="email" {...register("email")} className="col-span-3" />
          {errors.email && (
            <p className="col-span-4 text-sm text-red-500">
              {t('errors.email')}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="country" className="text-right">
            {t('country')}
          </Label>
          <Input id="country" {...register("country")} className="col-span-3" />
          {errors.country && (
            <p className="col-span-4 text-sm text-red-500">
              {t('errors.country')}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="country" className="text-right">
            {t('state')}
          </Label>
          <Input id="state" {...register("state")} className="col-span-3" />
          {errors.state && (
            <p className="col-span-4 text-sm text-red-500">
              {t('errors.state')}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="city" className="text-right">
            {t('city')}
          </Label>
          <Input id="city" {...register("city")} className="col-span-3" />
          {errors.city && (
            <p className="col-span-4 text-sm text-red-500">
              {t('errors.city')}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="postalcode" className="text-right">
            {t('postalcode')}
          </Label>
          <Input
            id="postalcode"
            {...register("postalcode")}
            className="col-span-3"
          />
          {errors.postalcode && (
            <p className="col-span-4 text-sm text-red-500">
              {t('errors.postalcode')}
            </p>
          )}
        </div>

        <div className="col-span-4">
          <Label htmlFor="address" className="text-right">
            {t('address')}
          </Label>
          <Input id="address" {...register("address")} className="col-span-3" />
          {errors.address && (
            <p className="col-span-4 text-sm text-red-500">
              {t('errors.address')}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="gender" className="text-right">
            {t('gender')}
          </Label>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => {
              if (field.value === undefined) {
                return <></>;
              }
              return (
                <Select
                  dir="rtl"
                  onValueChange={field.onChange}
                  defaultValue={field.value!}
                  value={field.value!}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t('genderPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">{t('female')}</SelectItem>
                    <SelectItem value="male">{t('male')}</SelectItem>
                    <SelectItem value="other">{t('other')}</SelectItem>
                  </SelectContent>
                </Select>
              );
            }}
          />
          {errors.gender && (
            <p className="col-span-4 text-sm text-red-500">
              {t('errors.gender')}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="birthDate" className="text-right mb-3">
            {t('birthDate')}
          </Label>
          <Controller
            control={control}
            name="birthDate"
            rules={{ required: true }}
            render={({
              field: { onChange, name, value },
              fieldState: { invalid, isDirty },
              formState: { errors },
            }) => (
              <>
                <DatePicker
                  containerClassName="w-full"
                  style={{ width: "100%" }}
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
                  <span>{t('errors.birthDateRequired')}</span>
                )}
              </>
            )}
          />
          {errors.birthDate && (
            <p className="col-span-4 text-sm text-red-500">
              {t('errors.birthDate')}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full">
        {t('save')}
        {isSubmitLoading && <LoadingSpinner className="mr-1" size={20} />}
      </Button>
    </form>
  );
}

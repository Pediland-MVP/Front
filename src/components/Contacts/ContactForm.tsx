// src/components/Contacts/contactForm.tsx
"use client";

import { mutateIncludeStringKey } from "@/utils/mutateIncludeStringKey";
import api from "@/hooks/swr/api-client";
import { ExceptionMessage } from "@/types/exceptionMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { Controller, useForm } from "react-hook-form";
import DatePicker from "react-multi-date-picker";
import { mutate } from "swr";
import useSWRImmutable from "swr/immutable";
import { z } from "zod";

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/index";

import LoadingSpinner from "@/components/ui/loadingSpinner";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";

export type ContactFormProps = {
  contactId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const ContactFormSchema = z.object({
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

type ContactFormData = z.infer<typeof ContactFormSchema>;

export const ContactForm = ({ contactId, open, setOpen }: ContactFormProps) => {
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const t = useTranslations("Contacts.Form");
  const t_ec = useTranslations("ERROR_CODES");

  const {
    data: contact,
    error: contactError,
    isLoading: isContactLoading,
    mutate: mutateContact,
  } = useSWRImmutable(`/contacts/${contactId}`);

  console.log(contact);

  const form = useForm<ContactFormData>();

  // useEffect(() => {
  //   return () => {
  //     form.reset();
  //   };
  // }, []);

  // useEffect(() => {
  //   if (!contact || open === false) return;
  //   form.reset({
  //     ...contact,
  //     ...(contact.birthDate && {
  //       birthDate: new Date(contact.birthDate).getTime().toString(),
  //     }),
  //   });
  // }, [contact]);

  // const onSubmit = async (values: ContactFormData) => {
  //   setIsSubmitLoading(true);
  //   await api
  //     .put(`/contacts/${contactId}`, values)
  //     .then(async (res) => {
  //       toast({
  //         title: t("updated"),
  //       });
  //       await mutate(mutateIncludeStringKey("contacts"));
  //     })
  //     .catch((e: AxiosError<ExceptionMessage>) => {
  //       toast({
  //         title: t_ec(e.response?.data?.code),
  //         variant: "destructive",
  //       });
  //     })
  //     .finally(() => {
  //       setIsSubmitLoading(false);
  //     });
  // };

  if (isContactLoading || !contact) {
    return <p>Loading...</p>;
  }

  return (
    <Form {...form}>
      <form
        // onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-12 gap-x-2 gap-y-4"
      >
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem className="col-span-4 md:col-span-3">
              <FormLabel> {t("gender")}</FormLabel>
              <FormControl>
                <Select dir="rtl">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("genderPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">{t("female")}</SelectItem>
                    <SelectItem value="male">{t("male")}</SelectItem>
                    <SelectItem value="other">{t("other")}</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="firstname"
          render={({ field }) => (
            <FormItem className="col-span-4 md:col-span-4">
              <FormLabel>{t("firstname")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastname"
          render={({ field }) => (
            <FormItem className="col-span-4 md:col-span-5">
              <FormLabel>{t("lastname")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem className="md:col-span-4">
              <FormLabel>{t("birthDate")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem className="md:col-span-4">
              <FormLabel>{t("mobile")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="md:col-span-4">
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem className="md:col-span-4">
              <FormLabel>{t("state")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem className="md:col-span-4">
              <FormLabel>{t("city")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="postalcode"
          render={({ field }) => (
            <FormItem className="md:col-span-4">
              <FormLabel>{t("postalcode")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem className="md:col-span-12">
              <FormLabel>{t("address")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="col-span-12 flex gap-2 mt-3 justify-center">
          <Button type="submit">
            {t("saveChanges")}
            {isSubmitLoading && <LoadingSpinner size={20} />}
          </Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

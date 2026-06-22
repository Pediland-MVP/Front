// src/components/Contacts/contactForm.tsx
"use client";

import { isAxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { mutate as globalMutate } from "swr";
import useSWRImmutable from "swr/immutable";
import { z } from "zod";

import api from "@/hooks/swr/api-client";
import type { ExceptionMessage } from "@/types/exceptionMessage";

import {
  Button,
  Input, Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui";

import { LoaderSpin } from "@/components/ui-custom/LoaderSpin";
import {
  Form,
  FormControl, FormField,
  FormItem,
  FormLabel,
  FormMessage
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

  const form = useForm<ContactFormData>({
    defaultValues: {
      firstname: contact?.firstname || "",
      lastname: contact?.lastname || "",
      mobile: contact?.mobile || "",
      email: contact?.email || "",
      country: contact?.country || "",
      city: contact?.city || "",
      state: contact?.state || "",
      gender: contact?.gender || "",
      birthDate: contact?.birthDate || "",
      postalcode: contact?.postalcode || "",
      address: contact?.address || "",
    },
  });

  // `contact` is fetched asynchronously, so `defaultValues` (read once on mount)
  // are still empty when the data arrives. Re-sync the form once it loads so the
  // inputs are populated and the submitted payload reflects the real values.
  useEffect(() => {
    if (!contact) return;
    form.reset({
      firstname: contact.firstname || "",
      lastname: contact.lastname || "",
      mobile: contact.mobile || "",
      email: contact.email || "",
      country: contact.country || "",
      city: contact.city || "",
      state: contact.state || "",
      gender: contact.gender || "",
      birthDate: contact.birthDate || "",
      postalcode: contact.postalcode || "",
      address: contact.address || "",
    });
  }, [contact, form]);

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitLoading(true);
    try {
      // The backend `PUT /contacts/:id` only accepts these fields. `city`/`state`
      // are not part of the DTO and `birthDate` expects a numeric timestamp that
      // this free-text form can't produce, so both are omitted. We preserve the
      // existing `cityId`, which the backend requires to resolve a valid city.
      const editableFields = [
        "firstname",
        "lastname",
        "mobile",
        "email",
        "country",
        "postalcode",
        "address",
        "gender",
      ] as const;

      const payload: Record<string, unknown> = {};
      for (const key of editableFields) {
        const value = data[key];
        if (value != null && value !== "") payload[key] = value;
      }
      if (contact["cityId"] != null) payload["cityId"] = contact["cityId"];

      await api.put(`/contacts/${contactId}`, payload);

      toast.success(t("updated"));
      await mutateContact();
      // Revalidate the contacts list so the table reflects the edit.
      await globalMutate(
        (key) => typeof key === "string" && key.startsWith("/contacts"),
      );
      setOpen(false);
    } catch (error) {
      const code = isAxiosError(error)
        ? (error.response?.data as ExceptionMessage | undefined)?.code
        : undefined;
      toast.error(code ? t_ec(code) : t("errors.update"));
    } finally {
      setIsSubmitLoading(false);
    }
  };

  if (isContactLoading || !contact) {
    return <p>Loading...</p>;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-12 gap-x-2 gap-y-4"
      >
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem className="col-span-12 sm:col-span-6 md:col-span-3">
              <FormLabel> {t("gender")}</FormLabel>
              <FormControl>
                <Select
                  dir="rtl"
                  value={field.value || ""}
                  onValueChange={field.onChange}
                >
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
            <FormItem className="col-span-12 sm:col-span-6 md:col-span-4">
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
            <FormItem className="col-span-12 sm:col-span-6 md:col-span-5">
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
            <FormItem className="col-span-12 sm:col-span-6 md:col-span-4">
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
            <FormItem className="col-span-12 sm:col-span-6 md:col-span-4">
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
            <FormItem className="col-span-12 sm:col-span-6 md:col-span-4">
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
            <FormItem className="col-span-12 sm:col-span-6 md:col-span-4">
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
            <FormItem className="col-span-12 sm:col-span-6 md:col-span-4">
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
            <FormItem className="col-span-12 sm:col-span-6 md:col-span-4">
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
            <FormItem className="col-span-12">
              <FormLabel>{t("address")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="col-span-12 mt-6 flex flex-col sm:flex-row justify-center gap-2">
          <Button type="submit">
            {t("saveChanges")}
            {isSubmitLoading && <LoaderSpin/>}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            {t("cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

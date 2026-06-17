"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import useSWR from "swr";

import api from "@/hooks/swr/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubscriptionsEditor } from "./subscriptions-editor";
import { CreateWebhookResult, RevealedSecrets, WebhookDetail } from "./types";

interface WebhookFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint?: WebhookDetail;
  onCreated?: (secrets: RevealedSecrets) => void;
  onSaved: () => void;
}

export function WebhookFormDialog({
  open,
  onOpenChange,
  endpoint,
  onCreated,
  onSaved,
}: WebhookFormDialogProps) {
  const t = useTranslations("Webhooks");
  const isEdit = !!endpoint;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: typesData } = useSWR<{ data: { types: string[] } }>(
    "/analytics-webhooks/event-types",
  );
  const types = typesData?.data?.types ?? [];

  const FormSchema = z.object({
    name: z.string().min(1, t("validationNameRequired")),
    url: z.string().url(t("validationUrlInvalid")).startsWith("https://", t("validationUrlInvalid")),
    status: z.enum(["active", "disabled"]),
    patterns: z.array(z.string()).min(1, t("validationSubscriptionsRequired")),
  });
  type FormValues = z.infer<typeof FormSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: "", url: "", status: "active", patterns: [] },
  });

  useEffect(() => {
    if (!open) return;
    if (endpoint) {
      form.reset({
        name: endpoint.name,
        url: endpoint.url,
        status: endpoint.status,
        patterns: endpoint.subscriptions.map((s) => s.pattern),
      });
    } else {
      form.reset({ name: "", url: "", status: "active", patterns: [] });
    }
  }, [open, endpoint, form]);

  const submit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEdit && endpoint) {
        await api.patch(`/analytics-webhooks/${endpoint.id}`, {
          name: data.name,
          url: data.url,
          status: data.status,
          patterns: data.patterns,
        });
        toast.success(t("toastUpdated"));
        onOpenChange(false);
        onSaved();
      } else {
        const res = await api.post<{ data: CreateWebhookResult }>("/analytics-webhooks", {
          name: data.name,
          url: data.url,
          patterns: data.patterns,
        });
        toast.success(t("toastCreated"));
        onOpenChange(false);
        onSaved();
        onCreated?.({
          apiKey: res.data.data.apiKey,
          signingSecret: res.data.data.signingSecret,
        });
      }
    } catch {
      toast.error(t("toastError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("formName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("formNamePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("formUrl")}</FormLabel>
                  <FormControl>
                    <Input dir="ltr" placeholder="https://hooks.example.com/befroosh" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEdit ? (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("formStatus")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">{t("statusActive")}</SelectItem>
                        <SelectItem value="disabled">{t("statusDisabled")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="patterns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("formSubscriptions")}</FormLabel>
                  <FormControl>
                    <SubscriptionsEditor
                      types={types}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isEdit ? t("save") : t("create")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

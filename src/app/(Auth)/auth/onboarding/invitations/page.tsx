"use client";

import api, { fetcher } from "@/hooks/swr/api-client";
import { setAccessToken } from "@/hooks/swr/api-client";
import useUser from "@/hooks/useUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import useSWR from "swr";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
} from "@/components/ui";
import { ButtonLoading } from "@/components/ui-custom/ButtonLoading";
import { LoaderSpin } from "@/components/ui-custom/LoaderSpin";

type Invitation = {
  id: string;
  workspace: { id: string; name: string };
  inviter: { firstname: string | null; lastname: string | null };
  message: string | null;
  permissions: string[];
};

export default function OnboardingInvitationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Auth.Invitations");
  const t_ec = useTranslations("ERROR_CODES");
  const { mutate: mutateUser, isOnboarding } = useUser();
  // returnTo is set by AuthProvider when it routes a connect-flow user here
  // so that Skip sends them back to /connect rather than /auth/onboarding
  const returnTo = searchParams.get("returnTo") ?? (isOnboarding ? "/auth/onboarding" : "/connect");

  const { data, isLoading } = useSWR<{ data?: Invitation[] } | Invitation[]>(
    "/invitations/pending",
    fetcher,
  );

  const invitations: Invitation[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data.data ?? []);
  }, [data]);

  const formSchema = useMemo(
    () =>
      z.object({
        invitationId: z.string().uuid({ message: t("must_pick_one") }),
        firstname: z.string().min(3, t("first_name_too_short")),
        lastname: z.string().min(3, t("last_name_too_short")),
      }),
    [t],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: { invitationId: "", firstname: "", lastname: "" },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const res = await api.post("/auth/onboarding/acceptInvitation", values);
      const accessToken = res.data?.data?.accessToken ?? res.data?.accessToken;
      if (accessToken) setAccessToken(accessToken);
      await mutateUser();
      router.push("/");
    } catch (err: any) {
      console.error("acceptInvitationDuringOnboarding error", err);
      toast.error(t_ec(err.response?.data?.code) || t("accept_error"));
      setIsSubmitting(false);
    }
  };

  // Deny all pending invitations so the backend status reflects the skip.
  // Failures are silently swallowed — the user experience should not be blocked
  // by a failed deny call (they are just dismissing, not actively rejecting).
  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await Promise.allSettled(
        invitations.map((inv) => api.post(`/invitations/${inv.id}/deny`)),
      );
    } finally {
      sessionStorage.setItem("invitePickerDismissed", "1");
      router.push(returnTo);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-lvh w-full items-center justify-center">
        <LoaderSpin />
      </div>
    );
  }

  if (invitations.length === 0) {
    // Defensive — the AuthProvider gate normally prevents this.
    return (
      <div className="flex h-lvh w-full flex-col items-center justify-center px-10">
        <p className="text-muted-foreground mb-4 text-sm">
          {t("no_invitations")}
        </p>
        <ButtonLoading onClick={handleSkip} isLoading={isSkipping}>
          {t("continue_without_joining")}
        </ButtonLoading>
      </div>
    );
  }

  return (
    <div className="flex h-lvh w-full flex-col items-center justify-start overflow-x-hidden px-6 pt-12">
      <div className="flex w-full max-w-md flex-1 flex-col items-center justify-start">
        <h1 className="text-primary mb-1 text-lg font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground mb-5 text-center text-sm">
          {t("description")}
        </p>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-4"
          >
            <FormField
              control={form.control}
              name="invitationId"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-2">
                    {invitations.map((inv) => {
                      const checked = field.value === inv.id;
                      return (
                        <label
                          key={inv.id}
                          className={`flex cursor-pointer flex-col rounded-md border p-3 transition ${
                            checked ? "border-primary bg-primary/5" : "border-muted"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="invitationId"
                              value={inv.id}
                              checked={checked}
                              onChange={() => field.onChange(inv.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-medium">
                                {inv.workspace?.name ?? "—"}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {t("invited_by")}{" "}
                                {inv.inviter?.firstname ?? ""}{" "}
                                {inv.inviter?.lastname ?? ""}
                              </div>
                              <div className="text-muted-foreground mt-1 text-xs">
                                {t("permissions_count", {
                                  count: inv.permissions?.length ?? 0,
                                })}
                              </div>
                              {inv.message ? (
                                <div className="mt-2 text-xs">
                                  <span className="text-muted-foreground">
                                    {t("message_label")}:{" "}
                                  </span>
                                  {inv.message}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstname"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("first_name_placeholder")}
                      className="text-center"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastname"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("last_name_placeholder")}
                      className="text-center"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ButtonLoading
              className="w-full"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {t("join_button")}
            </ButtonLoading>

            <ButtonLoading
              type="button"
              variant="link"
              onClick={handleSkip}
              isLoading={isSkipping}
              disabled={isSubmitting || isSkipping}
              className="text-muted-foreground w-full"
            >
              {t("continue_without_joining")}
            </ButtonLoading>
          </form>
        </Form>
      </div>
    </div>
  );
}

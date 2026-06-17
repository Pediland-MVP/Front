"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import useSWR from "swr";

import api from "@/hooks/swr/api-client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { WebhookFormDialog } from "./webhook-form-dialog";
import { RevealedSecrets, WebhookDetail } from "./types";

type ConfirmKind = "delete" | "rotateKey" | "rotateSecret" | null;

interface WebhookDrawerProps {
  endpointId: string | null;
  onClose: () => void;
  onListChange: () => void;
  onReveal: (secrets: RevealedSecrets) => void;
}

export function WebhookDrawer({ endpointId, onClose, onListChange, onReveal }: WebhookDrawerProps) {
  const t = useTranslations("Webhooks");
  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading, mutate } = useSWR<{ data: WebhookDetail }>(
    endpointId ? `/analytics-webhooks/${endpointId}` : null,
  );
  const endpoint = data?.data;

  const refreshAll = () => {
    void mutate();
    onListChange();
  };

  const doDelete = async () => {
    if (!endpoint) return;
    setBusy(true);
    try {
      await api.delete(`/analytics-webhooks/${endpoint.id}`);
      toast.success(t("toastDeleted"));
      setConfirm(null);
      onClose();
      onListChange();
    } catch {
      toast.error(t("toastError"));
    } finally {
      setBusy(false);
    }
  };

  const doRotateKey = async () => {
    if (!endpoint) return;
    setBusy(true);
    try {
      const res = await api.post<{ data: { apiKey: string } }>(
        `/analytics-webhooks/${endpoint.id}/rotate-api-key`,
      );
      toast.success(t("toastKeyRotated"));
      setConfirm(null);
      refreshAll();
      onReveal({ apiKey: res.data.data.apiKey });
    } catch {
      toast.error(t("toastError"));
    } finally {
      setBusy(false);
    }
  };

  const doRotateSecret = async () => {
    if (!endpoint) return;
    setBusy(true);
    try {
      const res = await api.post<{ data: { signingSecret: string } }>(
        `/analytics-webhooks/${endpoint.id}/rotate-secret`,
      );
      toast.success(t("toastSecretRotated"));
      setConfirm(null);
      refreshAll();
      onReveal({ signingSecret: res.data.data.signingSecret });
    } catch {
      toast.error(t("toastError"));
    } finally {
      setBusy(false);
    }
  };

  const doEnable = async () => {
    if (!endpoint) return;
    setBusy(true);
    try {
      await api.post(`/analytics-webhooks/${endpoint.id}/enable`);
      toast.success(t("toastEnabled"));
      refreshAll();
    } catch {
      toast.error(t("toastError"));
    } finally {
      setBusy(false);
    }
  };

  const confirmConfig: Record<
    Exclude<ConfirmKind, null>,
    { title: string; body: string; action: () => void }
  > = {
    delete: { title: t("confirmDeleteTitle"), body: t("confirmDeleteBody"), action: doDelete },
    rotateKey: {
      title: t("confirmRotateKeyTitle"),
      body: t("confirmRotateKeyBody"),
      action: doRotateKey,
    },
    rotateSecret: {
      title: t("confirmRotateSecretTitle"),
      body: t("confirmRotateSecretBody"),
      action: doRotateSecret,
    },
  };

  return (
    <Sheet open={!!endpointId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-md" dir="rtl">
        <SheetHeader>
          <SheetTitle>{t("detailTitle")}</SheetTitle>
        </SheetHeader>

        {isLoading || !endpoint ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-5 overflow-y-auto p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{endpoint.name}</span>
                <Badge variant={endpoint.status === "active" ? "default" : "secondary"}>
                  {endpoint.status === "active" ? t("statusActive") : t("statusDisabled")}
                </Badge>
              </div>
              <code dir="ltr" className="block break-all font-mono text-xs text-muted-foreground">
                {endpoint.url}
              </code>
              <div className="text-xs text-muted-foreground">
                {t("apiKeyPrefix")}: <span className="font-mono">{endpoint.apiKeyPrefix}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">{t("subscriptions")}</div>
              <div className="flex flex-wrap gap-1">
                {endpoint.subscriptions.map((s) => (
                  <Badge key={s.id} variant="outline" className="font-mono text-xs">
                    {s.pattern}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-1 rounded-md border p-3 text-sm">
              <div className="font-medium">{t("deliveryHealth")}</div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("consecutiveFailures")}</span>
                <span className={endpoint.consecutiveFailures > 0 ? "text-destructive" : undefined}>
                  {endpoint.consecutiveFailures}
                </span>
              </div>
              {endpoint.autoDisabledAt ? (
                <div className="space-y-2 pt-2">
                  <div className="text-destructive">
                    {t("autoDisabledReason")}: {endpoint.autoDisableReason ?? "—"}
                  </div>
                  <Button size="sm" disabled={busy} onClick={doEnable}>
                    {t("enable")}
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                {t("edit")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirm("rotateKey")}>
                {t("rotateApiKey")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirm("rotateSecret")}>
                {t("rotateSecret")}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirm("delete")}>
                {t("delete")}
              </Button>
            </div>
          </div>
        )}

        {endpoint ? (
          <WebhookFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            endpoint={endpoint}
            onSaved={refreshAll}
          />
        ) : null}

        <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
          <AlertDialogContent dir="rtl">
            {confirm ? (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>{confirmConfig[confirm].title}</AlertDialogTitle>
                  <AlertDialogDescription>{confirmConfig[confirm].body}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction disabled={busy} onClick={confirmConfig[confirm].action}>
                    {t("confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            ) : null}
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

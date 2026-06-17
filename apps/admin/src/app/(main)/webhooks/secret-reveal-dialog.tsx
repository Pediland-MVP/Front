"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RevealedSecrets } from "./types";

interface SecretRevealDialogProps {
  secrets: RevealedSecrets | null;
  onClose: () => void;
}

function SecretRow({ label, value }: { label: string; value: string }) {
  const t = useTranslations("Webhooks");
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("copyFailed"));
    }
  };
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs">{value}</code>
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          {copied ? t("copied") : t("copy")}
        </Button>
      </div>
    </div>
  );
}

export function SecretRevealDialog({ secrets, onClose }: SecretRevealDialogProps) {
  const t = useTranslations("Webhooks");
  return (
    <Dialog open={!!secrets} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>{t("revealTitle")}</DialogTitle>
          <DialogDescription className="text-destructive">{t("revealWarning")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {secrets?.apiKey ? <SecretRow label={t("apiKeyLabel")} value={secrets.apiKey} /> : null}
          {secrets?.signingSecret ? (
            <SecretRow label={t("signingSecretLabel")} value={secrets.signingSecret} />
          ) : null}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>{t("done")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

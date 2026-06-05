// src/components/table/dialog-sms.tsx
"use client";

import api from "@/hooks/swr/api-client";
import { useState } from "react";
import { toast } from "sonner";

// UI Imports
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ChatCenteredTextIcon } from "@phosphor-icons/react/dist/ssr";
import { SmsData } from "@/types/sms";

interface SendSMSDialogProps  {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  smsData: SmsData | null;
  recipientType: 'marketingLead' | 'user'
}

export function SendSMSDialog({
  open,
  onOpenChange,
  smsData,
  recipientType
}: SendSMSDialogProps) {
  const [text, setText] = useState("");

  const handleSend = async () => {
    if (!text.trim()) {
      toast.error("متن پیامک نمی‌تواند خالی باشد.");
      return;
    }

    try {
      await api.post("/sms/sendSms", {
        recipientType,
        leadOrUserId: smsData?.id ?? "",
        text,
      });

      toast.success("پیامک با موفقیت ارسال شد.");
      setText("");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("ارسال پیامک با خطا مواجه شد.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <ChatCenteredTextIcon weight="duotone" /> ارسال پیامک
          </DialogTitle>
          <DialogDescription>
            شماره گیرنده: {smsData?.mobile} <br />
            نام گیرنده: {smsData?.name ?? "نامشخص"}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="متن پیامک..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded border p-2 text-sm"
        />
        <Button onClick={handleSend}>ارسال</Button>
      </DialogContent>
    </Dialog>
  );
}

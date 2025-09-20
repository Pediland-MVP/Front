// src/components/Contacts/ContactDetailsDialog.tsx
"use client";

import { useTranslations } from "next-intl";

import {
  DialogStyled,
  DialogStyledBody,
  DialogStyledContent,
  DialogStyledDescription,
  DialogStyledHeader,
  DialogStyledTitle,
} from "@/components/index";
import { ContactForm } from "./ContactForm";

type ContactDetailsDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  contactId: string;
};

export const ContactDetailsDialog = ({
  open,
  setOpen,
  contactId,
}: ContactDetailsDialogProps) => {
  const t = useTranslations("Contacts.Dialog");

  return (
    <DialogStyled open={open} onOpenChange={setOpen}>
      <DialogStyledContent showCloseButton={false}>
        <DialogStyledHeader>
          <DialogStyledTitle icon={'AddressBookTabsIcon'}>{t("detailsInfo")}</DialogStyledTitle>
          <DialogStyledDescription></DialogStyledDescription>
        </DialogStyledHeader>
        <DialogStyledBody>
          <ContactForm contactId={contactId} open={open} setOpen={setOpen} />
        </DialogStyledBody>
      </DialogStyledContent>
    </DialogStyled>
  );
};

// src/components/Contacts/ContactsList.tsx
"use client";

import { ContactDetailsDialog, DataTable } from "@/components/index";
import { ContactTableColumns } from "./ContactTableColumns";
import useSWRImmutable from "swr/immutable";
import { ContactNamespace } from "@/types/contact";
import { useState } from "react";

export const ContactsList = ({ search }: { search: string }) => {
  // Dialog
  const [open, setOpen] = useState<boolean>(false);
  const [contactId, setContactId] = useState<string>("");
  // Table
  const columns = ContactTableColumns(setOpen, setContactId);

  const page = 1;
  const limit = 12;
  const onPageChange = (page: number) => {};
  const onLimitChange = (limit: number) => {};

  const {
    data: contactsData,
    error: contactsError,
    isLoading: isContactsLoading,
    mutate: mutateContacts,
  } = useSWRImmutable<ContactNamespace.GET>(
    `/contacts?page=${page}&limit=${limit}${search ? `&search=${search}` : ""}`,
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={contactsData?.items || []}
        isLoading={isContactsLoading}
        page={page}
        limit={limit}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        totalCount={contactsData?.meta?.totalItems || 0}
      />

      <ContactDetailsDialog
        open={open}
        setOpen={setOpen}
        contactId={contactId}
      />
    </>
  );
};

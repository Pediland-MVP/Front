"use client";

import { useState } from "react";
import Link from "next/link";
import { ContactNamespace } from "@/types/contact";
import { Pagination } from "./pagination";
import useSWRImmutable from "swr/immutable";
import { fetcher } from "@/hooks/swr/fetcher";
import ContactListSkeleton from "./contactListSkeleton";
import useDebounce from "@/hooks/useDebounce";
import EditContactDialog from "./editContactDialog";
import { useLocale, useTranslations } from "next-intl";
// Just UI Imports Below
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/theme/ui/table";
import ImageWithFallback from "@/components/ui/imageWithCallback";
import { Pencil } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/theme/ui/card";

type Lead = {
  profile: string;
  name: string;
  username: string;
  messages: number;
  lastSeen: string;
};

type ContactListCardProps = {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
};

export default function ContactListCard({
  search,
  setSearch,
}: ContactListCardProps) {
  const [sortColumn, setSortColumn] = useState<keyof Lead>("messages");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [limit, setLimit] = useState<number>(10);
  // const [contacts, setContacts] = useState<ContactNamespace.Contacts>([]);
  const [page, setPage] = useState<number>(1);
  const debouncedSearchTerm = useDebounce(search, 500);
  const [open, setOpen] = useState<boolean>(false);
  const [contactId, setContactId] = useState<string>("");

  const {
    data: contactsData,
    error: contactsError,
    isLoading: isContactsLoading,
    mutate: fetchContacts,
  } = useSWRImmutable<ContactNamespace.GET>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/contacts?page=${page}&limit=${limit}${search ? `&search=${debouncedSearchTerm}` : ""}`
  );
  const contacts = contactsData?.items || [];
  const contactsMeta = contactsData?.meta || undefined;

  const onPageChange = (value: number) => {
    setPage(value);
  };

  const onPageSizeChange = (value: number) => {
    setLimit(value);
  };

  const handleSort = (column: keyof Lead) => {
    setSortColumn(column);
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleSelect = (contactId: string) => {
    setSelectedLeads((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };
  const t = useTranslations("Contacts.List");
  const locale = useLocale();

  return (
    <Card className="border-b-2 border-gray-100">
      <EditContactDialog contactId={contactId} open={open} setOpen={setOpen} />

      <div className="_table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="lg:w-[7%] text-center">
                {t("image")}
              </TableHead>

              <TableHead
                onClick={() => handleSort("name")}
                className={`cursor-pointer hover:text-black lg:w-[25%] ${locale === "fa" ? "text-right" : "text-left"}`}
              >
                {t("userName")}
                {sortColumn === "name" && (
                  <span className="mr-2">
                    {sortDirection === "asc" ? "\u2191" : "\u2193"}
                  </span>
                )}
              </TableHead>

              <TableHead
                className="cursor-pointer text-center hover:text-black lg:w-[25%]"
                onClick={() => handleSort("username")}
              >
                {t("instagramId")}
                {sortColumn === "username" && (
                  <span className="mr-2">
                    {sortDirection === "asc" ? "\u2191" : "\u2193"}
                  </span>
                )}
              </TableHead>

              <TableHead
                className="cursor-pointer text-center hover:text-black lg:w-[8%]"
                onClick={() => handleSort("messages")}
              >
                {t("messageCount")}
                {sortColumn === "messages" && (
                  <span className="mr-2">
                    {sortDirection === "asc" ? "\u2191" : "\u2193"}
                  </span>
                )}
              </TableHead>

              <TableHead className="lg:w-[27%] _space"></TableHead>

              <TableHead className="text-center lg:w-[7%]">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody id="scrollableDiv">
            {isContactsLoading ? (
              <ContactListSkeleton rowCount={limit} />
            ) : (
              contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className={
                    selectedLeads.includes(contact.id) ? "bg-muted" : ""
                  }
                >
                  <TableCell>
                    <Link
                      className="flex justify-center"
                      href={"/console/contacts/item"}
                    >
                      <ImageWithFallback
                        src={
                          contact.lead?.profilePic ??
                          "https://github.com/shadcn.png"
                        }
                        fallbackSrc="https://github.com/shadcn.png"
                        alt={`${contact.firstname && contact.lastname
                            ? `${contact.firstname} ${contact.lastname}`
                            : contact.lead?.firstname
                          } profile`}
                        width={38}
                        height={38}
                        className="rounded-full"
                      />
                    </Link>
                  </TableCell>

                  <TableCell className="">
                    <Link
                      href={"/console/contacts/item"}
                      className="hover:text-pink-700"
                    >
                      {contact.firstname && contact.lastname
                        ? `${contact.firstname} ${contact.lastname}`
                        : contact.lead?.firstname}
                    </Link>
                  </TableCell>

                  <TableCell className="text-center">
                    <span dir="ltr">{contact.username}</span>
                  </TableCell>

                  <TableCell className="text-center">
                    {contact.messagesCount}
                  </TableCell>

                  <TableCell className="_space"></TableCell>

                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Pencil
                        size={20}
                        weight="light"
                        className="text-gray-500 hover:text-green-600 cursor-pointer"
                        onClick={() => {
                          setOpen(true);
                          setContactId(contact.id);
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={page}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSize={limit}
        totalItems={contactsMeta?.totalItems || limit}
        totalPages={contactsMeta?.totalPages || 1}
      />
    </Card>
  );
}

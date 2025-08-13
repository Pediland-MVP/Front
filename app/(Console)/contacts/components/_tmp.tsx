"use client";

import { useState } from "react";
import { ContactNamespace } from "@/types/contact";
import { Pagination } from "../../components/tablePagination";
import useSWRImmutable from "swr/immutable";
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

export default function ContactListPage({
  search,
  setSearch,
}: ContactListPageProps) {
  const [sortColumn, setSortColumn] = useState<
    "name" | "username" | "messages"
  >("messages");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [limit, setLimit] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const debouncedSearchTerm = useDebounce(search, 500);
  const [open, setOpen] = useState<boolean>(false);
  const [contactId, setContactId] = useState<string>("");

  const {
    data: contactsData,
    error: contactsError,
    isLoading: isContactsLoading,
  } = useSWRImmutable<ContactNamespace.GET>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/contacts?page=${page}&limit=${limit}${
      search ? `&search=${debouncedSearchTerm}` : ""
    }`,
  );
  const contacts = contactsData?.items || [];
  const contactsMeta = contactsData?.meta || undefined;

  const onPageChange = (value: number) => {
    setPage(value);
  };

  const onPageSizeChange = (value: number) => {
    setLimit(value);
  };

  const handleSort = (column: "name" | "username" | "messages") => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc"); // مقدار پیش‌فرض صعودی برای ستون جدید
    }
  };

  const t = useTranslations("Contacts.List");
  const locale = useLocale();

  // مرتب‌سازی سمت کاربر
  const sortedContacts = [...contacts].sort((a, b) => {
    let aValue: string | number = "";
    let bValue: string | number = "";
    if (sortColumn === "name") {
      aValue = a.firstname
        ? a.firstname.toLowerCase()
        : (a.lead?.firstname || "").toLowerCase();
      bValue = b.firstname
        ? b.firstname.toLowerCase()
        : (b.lead?.firstname || "").toLowerCase();
    } else if (sortColumn === "username") {
      aValue = a.username.toLowerCase();
      bValue = b.username.toLowerCase();
    } else if (sortColumn === "messages") {
      aValue = a.messagesCount;
      bValue = b.messagesCount;
    }
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="_contacts-page _table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("image")}</TableHead>

            <TableHead
              onClick={() => handleSort("name")}
              className={`cursor-pointer hover:text-black ${
                locale === "fa" ? "text-right" : "text-left"
              }`}
            >
              {t("userName")}
              {sortColumn === "name" && (
                <span className="mr-2">
                  {sortDirection === "asc" ? "\u2191" : "\u2193"}
                </span>
              )}
            </TableHead>

            <TableHead
              className="cursor-pointer hover:text-black"
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
              className="cursor-pointer hover:text-black"
              onClick={() => handleSort("messages")}
            >
              {t("messageCount")}
              {sortColumn === "messages" && (
                <span className="mr-2">
                  {sortDirection === "asc" ? "\u2191" : "\u2193"}
                </span>
              )}
            </TableHead>

            <TableHead>{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody id="scrollableDiv">
          {contactsError ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-red-500">
                {t("errorLoadingContacts")}
              </TableCell>
            </TableRow>
          ) : isContactsLoading ? (
            <ContactListSkeleton rowCount={limit} />
          ) : (
            sortedContacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <ImageWithFallback
                      src={
                        contact.lead?.profilePic ??
                        "https://github.com/shadcn.png"
                      }
                      fallbackSrc="https://github.com/shadcn.png"
                      alt={`${
                        contact.firstname && contact.lastname
                          ? `${contact.firstname} ${contact.lastname}`
                          : contact.lead?.firstname
                      } profile`}
                      width={38}
                      height={38}
                      className="cursor-pointer rounded-full"
                      onClick={() => {
                        setOpen(true);
                        setContactId(contact.id);
                      }}
                    />
                  </div>
                </TableCell>

                <TableCell
                  className={`${locale === "fa" ? "text-right" : "text-left"}`}
                >
                  <span
                    className="hover:text-secondary cursor-pointer"
                    onClick={() => {
                      setOpen(true);
                      setContactId(contact.id);
                    }}
                  >
                    {contact.firstname && contact.lastname
                      ? `${contact.firstname} ${contact.lastname}`
                      : contact.lead?.firstname}
                  </span>
                </TableCell>

                <TableCell>
                  <span dir="ltr">{contact.username}</span>
                </TableCell>

                <TableCell>{contact.messagesCount}</TableCell>

                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Pencil
                      size={20}
                      weight="light"
                      className="cursor-pointer hover:text-green-600"
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

      <Pagination
        currentPage={page}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSize={limit}
        totalItems={contactsMeta?.totalItems || limit}
        totalPages={contactsMeta?.totalPages || 1}
      />

      <EditContactDialog contactId={contactId} open={open} setOpen={setOpen} />
    </div>
  );
}

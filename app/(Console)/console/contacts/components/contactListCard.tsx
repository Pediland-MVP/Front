"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Pencil } from "@phosphor-icons/react";
import { ContactNamespace } from "@/types/contact";
import ImageWithFallback from "@/components/ui/imageWithCallback";
import { Pagination } from "./pagination";
import useSWRImmutable from "swr/immutable";
import { fetcher } from "@/hooks/swr/fetcher";
import ContactListSkeleton from "./contactListSkeleton";
import useDebounce from "@/hooks/useDebounce";
import EditContactDialog from "./editContactDialog";

type Lead = {
  profile: string;
  name: string;
  username: string;
  messages: number;
  lastSeen: string;
};

type ContactListCardProps = {
  search: string,
  setSearch: React.Dispatch<React.SetStateAction<string>>,
}

export default function ContactListCard({ search, setSearch }: ContactListCardProps) {
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
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/contacts?page=${page}&limit=${limit}${search ? `&search=${debouncedSearchTerm}` : ""}`,
    fetcher
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

  return (
    <div className="_table rounded-lg shadow bg-white">
      <EditContactDialog contactId={contactId} open={open} setOpen={setOpen} />
      {/* <div>
        <Input
          type="search"
          placeholder="جستجو ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-[20%]"
        />
      </div> */}

      <div className="max-h-[calc(100%-44px)] overflow-auto p-4">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="text-center w-[2%]">
                <Checkbox
                  checked={selectedLeads.length === contacts.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // setSelectedLeads(contacts?.map((lead) => lead));
                    } else {
                      setSelectedLeads([]);
                    }
                  }}
                />
              </TableHead>

              <TableHead className="w-[10%] text-center">تصویر</TableHead>

              <TableHead
                onClick={() => handleSort("name")}
                className="cursor-pointer text-right hover:text-black w-[25%]"
              >
                نام کاربر
                {sortColumn === "name" && (
                  <span className="mr-2">
                    {sortDirection === "asc" ? "\u2191" : "\u2193"}
                  </span>
                )}
              </TableHead>

              <TableHead
                className="cursor-pointer text-center hover:text-black w-[25%]"
                onClick={() => handleSort("username")}
              >
                آیدی اینستاگرام
                {sortColumn === "username" && (
                  <span className="mr-2">
                    {sortDirection === "asc" ? "\u2191" : "\u2193"}
                  </span>
                )}
              </TableHead>

              <TableHead
                className="cursor-pointer text-center hover:text-black w-[8%]"
                onClick={() => handleSort("messages")}
              >
                تعداد پیام
                {sortColumn === "messages" && (
                  <span className="mr-2">
                    {sortDirection === "asc" ? "\u2191" : "\u2193"}
                  </span>
                )}
              </TableHead>

              <TableHead className="w-[22%] _space"></TableHead>

              <TableHead className="text-center w-[7%]">عملیات</TableHead>
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
                    <Checkbox
                      checked={selectedLeads.includes(contact.id)}
                      onCheckedChange={() => handleSelect(contact.id)}
                    />
                  </TableCell>

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
                        alt={`${
                          contact.firstname && contact.lastname
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
                    <Link href={"/console/contacts/item"}>
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
                        className="text-gray-600 hover:text-green-700 cursor-pointer"
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
      </div>
    </div>
  );
}

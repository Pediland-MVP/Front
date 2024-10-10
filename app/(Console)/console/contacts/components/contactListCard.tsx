import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
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

type Lead = {
  profile: string;
  name: string;
  username: string;
  messages: number;
  lastSeen: string;
};

export default function ContactListCard() {
  const [sortColumn, setSortColumn] = useState<keyof Lead>("messages");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [limit, setLimit] = useState<number>(10);
  // const [contacts, setContacts] = useState<ContactNamespace.Contacts>([]);
  const [page, setPage] = useState<number>(1);
  const searchTimeout = useRef<ReturnType<typeof setInterval> | null>(null)
  const [search, setSearch] = useState("");
  const debouncedSearchTerm = useDebounce(search, 500);

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
  }

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
    <div className="flex flex-col gap-2 h-[calc(100%-40px)] max-h-[calc(100%-40px)]">
      <div>
        <Input
          type="search"
          placeholder="جستجو ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 max-w-[20%]"
        />
      </div>

      <div className="h-screen max-h-[calc(100%-44px)] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right w-[5%]">
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
              <TableHead className="w-[15%] text-center">تصویر</TableHead>
              <TableHead
                onClick={() => handleSort("name")}
                className="cursor-pointer text-center hover:text-black w-[25%]"
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
                className="cursor-pointer text-center hover:text-black w-[10%]"
                onClick={() => handleSort("messages")}
              >
                تعداد پیام
                {sortColumn === "messages" && (
                  <span className="mr-2">
                    {sortDirection === "asc" ? "\u2191" : "\u2193"}
                  </span>
                )}
              </TableHead>
              <TableHead className="text-center w-[10%]">عملیات</TableHead>
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
                  <TableCell className="w-[5%]">
                    <Checkbox
                      checked={selectedLeads.includes(contact.id)}
                      onCheckedChange={() => handleSelect(contact.id)}
                    />
                  </TableCell>
                  <TableCell className="w-[15%]">
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
                  <TableCell className="w-[25%] text-center">
                    <Link href={"/console/contacts/item"}>
                      {contact.firstname && contact.lastname
                        ? `${contact.firstname} ${contact.lastname}`
                        : contact.lead?.firstname}
                    </Link>
                  </TableCell>
                  <TableCell className="w-[25%] text-center">
                    <span dir="ltr">{contact.lead?.firstname}</span>
                  </TableCell>
                  <TableCell className="w-[10%] text-center">
                    {contact.messagesCount}
                  </TableCell>
                  <TableCell className="w-[10%] text-center">
                    <div className="flex gap-2 justify-center">
                      <Pencil
                        size={20}
                        weight="light"
                        className="text-gray-600 hover:text-green-700 cursor-pointer"
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

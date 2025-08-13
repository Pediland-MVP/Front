// app/(Console)/contacts/components/contactListPage.tsx

import useSWRImmutable from "swr/immutable";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { ContactNamespace } from "@/types/contact";

type ContactListPageProps = {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
};

export default function ContactListPage1() {
  const {
    data: contactsData,
    error: contactsError,
    isLoading: isContactsLoading,
  } = useSWRImmutable<ContactNamespace.GET>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/contacts?page=1&limit=10`,
  );

  console.log("..............", contactsData);

  return <DataTable columns={columns} data={contactsData?.items || []} />;
}

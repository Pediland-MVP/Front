import { DataTable } from "@/components/index";
import { ContactTableColumns } from "./ContactTableColumns";
import useSWRImmutable from "swr/immutable";
import { ContactNamespace } from "@/types/contact";

export const ContactsTable = () => {
  const columns = ContactTableColumns();
  const page = 1;
  const limit = 10;
  const onPageChange = (page: number) => {};
  const onLimitChange = (limit: number) => {};
  const rowSelection = {};
  const setSelectedRows = (rows: any[]) => {};

  const {
    data: contactsData,
    error: contactsError,
    isLoading: isContactsLoading,
  } = useSWRImmutable<ContactNamespace.GET>(
    `${process.env.NEXT_PUBLIC_BACK_API_URL}/contacts?page=${page}&limit=${limit}`,
  );

  console.log("contactsData", contactsData);

  return (
    <DataTable
      columns={columns}
      data={contactsData?.items || []}
      page={page}
      limit={limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      totalCount={contactsData?.meta?.totalItems || 0}
    />
  );
};

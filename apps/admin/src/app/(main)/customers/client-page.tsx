// src/app/(main)/customers/client-page.tsx
"use client";

import { fetcher } from "@/hooks/swr/api-client";
import { useKams } from "@/hooks/use-kams";
import { SmsData } from "@/types/sms";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";

// UI Imports
import { FetchError } from "@/components/fetch-error";
import { Loading } from "@/components/loading";
import { SendSMSDialog } from "@/components/table/dialog-sms";
import CustomerTable from "./customer-table";
import { useAuth } from "@/hooks/use-auth";
import { SortingState } from "@tanstack/react-table";

export type PanelModeType = 'standard' | 'pro'

export default function CustomersPageClient() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [customerSort, setCustomerSort] = useState("createDate");
  const [customerSortOrder, setCustomerSortOrder] = useState("desc");
  const [debouncedSearch] = useDebounce(search, 750);
  const [customersStatus, setCustomersStatus] = useState("");
  const [customerAdmins, setCustomerAdmins] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [actionDate, setActionDate] = useState<Date | null>(null);
  const [isIgTokenValid, setIsIgTokenValid] = useState("");
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsData, setSmsData] = useState<SmsData | null>(null);
  const [panelMode, setPanelMode] = useState<PanelModeType>('standard')

  const sortQuery = customerSort
    ? `&sort=${customerSort}:${customerSortOrder}`
    : "";
  const searchQuery = debouncedSearch ? `&search=${debouncedSearch}` : "";
  const statusQuery = customersStatus ? `&status=${customersStatus}` : "";
  const adminQuery =
    user && user.role !== "kam" && customerAdmins
      ? `&adminIds=${customerAdmins}`
      : "";

  const fakeUTCISOString = (date: Date) => {
    const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
    const fakeDate = new Date(date.getTime() - tzOffsetMs);
    return fakeDate.toISOString();
  };

  const actionDateQuery = actionDate
    ? `&actionDate=${fakeUTCISOString(actionDate)}`
    : "";

  const categoryQuery =
    categories.length > 0 ? `&categoryIds=${categories.join(",")}` : "";
  const igTokenQuery = isIgTokenValid ? `&isIgTokenValid=${isIgTokenValid}` : "";

  const {
    data: customersData,
    isLoading: isCustomersLoading,
    error: customersError,
    mutate: mutateCustomers,
  } = useSWR(
    `/users?limit=${limit}&page=${page}${searchQuery}${statusQuery}${adminQuery}${categoryQuery}${actionDateQuery}${igTokenQuery}${sortQuery}&panelMode=${panelMode}`,
    fetcher,
  );

  useEffect(() => {
    console.log("action date..", actionDateQuery);
  }, [actionDateQuery]);

  const customers = customersData?.items || [];
  const meta = customersData?.meta;

  const {
    kams,
    isLoading: isKamsLoading,
    isError: kamsError,
  } = useKams({
    roles: "manager,kam",
    enabled: user && user.role !== "kam",
  });

  const handleSortingChange = (sorting: SortingState) => {
    const sort = sorting[0];
    if (sort) {
      setCustomerSort(sort.id);
      setCustomerSortOrder(sort.desc ? "desc" : "asc");
    } else {
      setCustomerSort("");
      setCustomerSortOrder("asc");
    }
  };

  const openSmsDialog = (data: SmsData) => {
    setSmsData(data);
    setSmsDialogOpen(true);
  };

  if (isCustomersLoading || isKamsLoading) return <Loading />;
  if (customersError || kamsError) return <FetchError />;

  return (
    <>
      <CustomerTable
        user={user}
        customers={customers}
        mutateCustomers={mutateCustomers}
        kams={kams}
        openSmsDialog={openSmsDialog}
        meta={meta}
        onPageChange={setPage}
        onLimitChange={setLimit}
        search={search}
        onSearchChange={setSearch}
        setPanelMode={setPanelMode}
        panelMode={panelMode}
        sortingState={
          customerSort
            ? [{ id: customerSort, desc: customerSortOrder === "desc" }]
            : []
        }
        onSortingChange={handleSortingChange}
        customersStatus={customersStatus}
        onStatusChange={setCustomersStatus}
        customerAdmins={customerAdmins}
        onAdminChange={setCustomerAdmins}
        categories={categories}
        onCategoryChange={setCategories}
        actionDate={actionDate}
        onActionDateChange={setActionDate}
        isIgTokenValid={isIgTokenValid}
        onIgTokenValidChange={setIsIgTokenValid}
      />

      <SendSMSDialog
        open={smsDialogOpen}
        onOpenChange={setSmsDialogOpen}
        smsData={smsData}
        recipientType="user"
      />
    </>
  );
}

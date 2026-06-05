// src/app/leads/page.tsx
"use client";

import { fetcher } from "@/hooks/swr/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useKams } from "@/hooks/use-kams";
import { SmsData } from "@/types/sms";
import { useState } from "react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";

// UI Imports
import { FetchError } from "@/components/fetch-error";
import { Loading } from "@/components/loading";
import { SendSMSDialog } from "@/components/table/dialog-sms";
import LeadTable from "./lead-table";
// import { MarketingLead } from "@/types/lead";
// import { MarketingLeadsAdmins } from "@/types/admin";

export default function LeadsPageClient() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 750);
  const [leadsStatus, setLeadsStatus] = useState("");
  const [leadAdmins, setLeadAdmins] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [actionDate, setActionDate] = useState<Date | null>(null);

  const statusQuery = leadsStatus ? `&status=${leadsStatus}` : "";

  const adminQuery = leadAdmins ? `&adminIds=${leadAdmins}` : "";
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

  const {
    data: leadsData,
    isLoading: isLeadsLoading,
    error: leadsError,
    mutate: mutateLeads,
  } = useSWR(
    `/marketingLeads?limit=${limit}&page=${page}${search ? `&search=${debouncedSearch}` : ""}${statusQuery}${adminQuery}${categoryQuery}${actionDateQuery}`,
    fetcher,
  );

  const leads = leadsData?.items || [];
  // .filter((lead: MarketingLead) =>
  //   lead.marketingLeadsAdmins.some(
  //     (admin: MarketingLeadsAdmins) =>
  //       admin.adminId === user?.id && admin.isActive,
  //   ),
  // ) || [];
  const meta = leadsData?.meta;

  const {
    kams,
    isLoading: isKamsLoading,
    isError: kamsError,
  } = useKams({
    roles: "manager,kam",
    enabled: user && user.role !== "kam",
  });

  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsData, setSmsData] = useState<SmsData | null>(null);

  const openSmsDialog = (data: SmsData) => {
    setSmsData(data);
    setSmsDialogOpen(true);
  };

  if (isLeadsLoading || isKamsLoading) return <Loading />;
  if (leadsError || kamsError) return <FetchError />;

  return (
    <>
      <LeadTable
        user={user}
        leads={leads}
        mutateLeads={mutateLeads}
        kams={kams}
        openSmsDialog={openSmsDialog}
        meta={meta}
        onPageChange={setPage}
        onLimitChange={setLimit}
        search={search}
        onSearchChange={setSearch}
        leadsStatus={leadsStatus}
        onStatusChange={setLeadsStatus}
        leadAdmins={leadAdmins}
        onAdminChange={setLeadAdmins}
        categories={categories}
        onCategoryChange={setCategories}
        actionDate={actionDate}
        onActionDateChange={setActionDate}
      />

      <SendSMSDialog
        open={smsDialogOpen}
        onOpenChange={setSmsDialogOpen}
        smsData={smsData}
        recipientType="marketingLead"
      />
    </>
  );
}

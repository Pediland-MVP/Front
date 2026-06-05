// src/app/(main)/subscriptions/client-page.tsx
"use client";

import { fetcher } from "@/hooks/swr/api-client";
import { useKams } from "@/hooks/use-kams";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";
import { SubscriptionStatusEnum } from "@/types/subscription";

// UI Imports
import { FetchError } from "@/components/fetch-error";
import { Loading } from "@/components/loading";
import SubscriptionTable from "./subscription-table";
import { useAuth } from "@/hooks/use-auth";
import { SortingState } from "@tanstack/react-table";

export default function SubscriptionsPageClient() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState("");
  const [subscriptionSort, setSubscriptionSort] = useState("createDate");
  const [subscriptionSortOrder, setSubscriptionSortOrder] = useState("desc");
  const [debouncedSearch] = useDebounce(search, 750);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusEnum | "">("");
  const [userIds, setUserIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [subscriptionAdmins, setSubscriptionAdmins] = useState("");

  const adminQuery =
    user && user.role !== "kam" && subscriptionAdmins
      ? `&adminIds=${subscriptionAdmins}`
      : "";

  const sortQuery = subscriptionSort
    ? `&sort=${subscriptionSort}:${subscriptionSortOrder}`
    : "";
  const searchQuery = debouncedSearch ? `&search=${debouncedSearch}` : "";
  const statusQuery = subscriptionStatus ? `&status=${subscriptionStatus}` : "";
  const userIdsQuery = userIds.length > 0 ? `&userIds=${userIds.join(",")}` : "";

  const fakeUTCISOString = (date: Date) => {
    const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
    const fakeDate = new Date(date.getTime() - tzOffsetMs);
    return fakeDate.toISOString();
  };

  const startDateQuery = startDate
    ? `&startDate=${fakeUTCISOString(startDate)}`
    : "";
  const endDateQuery = endDate
    ? `&endDate=${fakeUTCISOString(endDate)}`
    : "";

  const {
    data: subscriptionsData,
    isLoading: isSubscriptionsLoading,
    isValidating: isSubscriptionsValidating,
    error: subscriptionsError,
    mutate: mutateSubscriptions,
  } = useSWR(
    `/subscriptions?limit=${limit}&page=${page}${searchQuery}${statusQuery}${userIdsQuery}${startDateQuery}${endDateQuery}${sortQuery}${adminQuery}`,
    fetcher,
    { keepPreviousData: true },
  );

  const subscriptions = subscriptionsData?.items || [];
  const meta = subscriptionsData?.meta;

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
      setSubscriptionSort(sort.id);
      setSubscriptionSortOrder(sort.desc ? "desc" : "asc");
    } else {
      setSubscriptionSort("");
      setSubscriptionSortOrder("asc");
    }
  };

  if ((!subscriptionsData && isSubscriptionsLoading) || isKamsLoading) return <Loading />;
  if (subscriptionsError || kamsError) return <FetchError />;

  return (
    <SubscriptionTable
      isRefetching={isSubscriptionsValidating && !!subscriptionsData}
      subscriptionAdmins={subscriptionAdmins}
      onAdminChange={setSubscriptionAdmins}
      user={user}
      subscriptions={subscriptions}
      mutateSubscriptions={mutateSubscriptions}
      kams={kams}
      meta={meta}
      onPageChange={setPage}
      onLimitChange={setLimit}
      search={search}
      onSearchChange={setSearch}
      sortingState={
        subscriptionSort
          ? [{ id: subscriptionSort, desc: subscriptionSortOrder === "desc" }]
          : []
      }
      onSortingChange={handleSortingChange}
      subscriptionStatus={subscriptionStatus}
      onStatusChange={setSubscriptionStatus}
      userIds={userIds}
      onUserIdsChange={setUserIds}
      startDate={startDate}
      onStartDateChange={setStartDate}
      endDate={endDate}
      onEndDateChange={setEndDate}
    />
  );
}

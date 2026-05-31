import useSWR from "swr";
import { fetcher } from "@/hooks/swr/api-client";

export type Invitation = {
  id: string;
  workspace: { name: string };
  inviter: { firstname: string; lastname: string };
  status: string;
};

export function useInvitations() {
  const { data, isLoading, mutate } = useSWR<any>(
    "/invitations/pending",
    fetcher,
  );

  const invitations: Invitation[] = Array.isArray(data)
    ? data
    : (data?.data ?? []);

  return {
    invitations,
    pendingCount: invitations.length,
    isLoading,
    mutate,
  };
}

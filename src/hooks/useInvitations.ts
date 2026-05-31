import useSWR from "swr";
import { fetcher } from "@/hooks/swr/api-client";
import { IResponseMessage } from "@/types/responseMessage";

export type Invitation = {
  id: string;
  workspace: { name: string };
  inviter: { firstname: string; lastname: string };
  status: string;
};

export function useInvitations() {
  const { data, error, isLoading, mutate } = useSWR<Invitation[] | IResponseMessage<Invitation[]>>(
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
    error,
    mutate,
  };
}

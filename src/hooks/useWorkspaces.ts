import useSWR from "swr";
import api, { fetcher } from "@/hooks/swr/api-client";
import { Workspace } from "@/types/workspace";
import { IResponseMessage } from "@/types/responseMessage";

export function useWorkspaces() {
  const { data, error, isLoading, mutate } = useSWR<IResponseMessage<Workspace[]>>(
    "/workspaces",
    fetcher
  );

  const changeWorkspace = async (workspaceId: string) => {
    await api.post("/auth/changeWorkspace", { workspaceId });
    window.location.reload();
  };

  return {
    workspaces: data?.data || [],
    isLoading,
    error,
    changeWorkspace,
    mutate
  };
}

import useSWR from "swr";
import api, { fetcher } from "@/hooks/swr/api-client";
import { Workspace } from "@/types/workspace";
import { IResponseMessage } from "@/types/responseMessage";

export function useWorkspaces() {
  const { data, error, isLoading, mutate } = useSWR<Workspace[] | IResponseMessage<Workspace[]>>(
    "/workspaces",
    fetcher
  );

  const changeWorkspace = async (workspaceId: string) => {
    await api.post("/auth/changeWorkspace", { workspaceId });
    window.location.reload();
  };

  const workspaces: Workspace[] = Array.isArray(data)
    ? data
    : (data?.data ?? []);

  return {
    workspaces,
    isLoading,
    error,
    changeWorkspace,
    mutate
  };
}

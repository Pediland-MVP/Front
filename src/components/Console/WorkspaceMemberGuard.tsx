"use client";

import api from "@/hooks/swr/api-client";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useEffect, useRef } from "react";
import useSWR from "swr";

const POLL_INTERVAL_MS = 30_000;

export default function WorkspaceMemberGuard() {
  const { workspaces, changeWorkspace } = useWorkspaces();
  const switchingRef = useRef(false);

  const { data } = useSWR(
    "/workspaces/isAllowed",
    () => api.get<{ data: boolean }>("/workspaces/isAllowed").then((r) => r.data),
    { refreshInterval: POLL_INTERVAL_MS, revalidateOnFocus: false },
  );

  useEffect(() => {
    if (data?.data === false && !switchingRef.current) {
      const personal = workspaces.find((w) => w.isPersonal);
      if (personal) {
        switchingRef.current = true;
        changeWorkspace(personal.id);
      }
    }
  }, [data, workspaces, changeWorkspace]);

  return null;
}

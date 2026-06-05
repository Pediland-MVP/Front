"use client";
import { SWRConfig } from "swr";
import { fetcher } from "../../hooks/swr/fetcher";

export default function SWRProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SWRConfig
      value={{
        fetcher,
        onError: (err, key, config) => {
          "use client";
          // Don't log expected "not found" errors
          if (err?.data?.code === "ORDER_PENDING_NOT_FOUND") {
            return;
          }
          console.log("Error", err, err.data, key, config);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}

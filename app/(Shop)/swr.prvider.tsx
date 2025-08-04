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
          console.log("Errror", err, err.data, key, config);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}

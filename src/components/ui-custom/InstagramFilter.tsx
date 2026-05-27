"use client";

import useSWRImmutable from "swr/immutable";
import { InstagramNamespace } from "@/types/instagram";
import { fetcher } from "@/hooks/swr/api-client";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface InstagramFilterProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export function InstagramFilter({ selectedIds, onChange }: InstagramFilterProps) {
  const { data: accounts, isLoading } = useSWRImmutable<
    InstagramNamespace.Account[]
  >(`${API_URL}/instagram/accounts`, fetcher, { revalidateOnMount: true });

  // Auto-select first account when accounts load and nothing is selected
  useEffect(() => {
    if (accounts && accounts.length > 0 && selectedIds.length === 0) {
      onChange([accounts[0].id]);
    }
  }, [accounts]);

  if (isLoading || !accounts || accounts.length === 0) return null;

  // Single account: show non-interactive chip
  if (accounts.length === 1) {
    return (
      <div className="flex gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium bg-primary text-primary-foreground">
          {accounts[0].username ?? accounts[0].name}
        </span>
      </div>
    );
  }

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      // Keep at least one selected
      if (selectedIds.length === 1) return;
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {accounts.map((account) => {
        const active = selectedIds.includes(account.id);
        return (
          <button
            key={account.id}
            type="button"
            onClick={() => toggle(account.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground hover:bg-muted border-border",
            )}
          >
            {account.profilePictureUrl && (
              <img
                src={account.profilePictureUrl}
                alt=""
                className="size-4 rounded-full object-cover"
              />
            )}
            {account.username ?? account.name}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import useSWRImmutable from "swr/immutable";
import { InstagramNamespace } from "@/types/instagram";
import { fetcher } from "@/hooks/swr/api-client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { InstagramLogoIcon } from "@phosphor-icons/react/dist/ssr";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { IResponseMessage } from "@/types/responseMessage";

interface InstagramFilterProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export function InstagramFilter({ selectedIds, onChange }: InstagramFilterProps) {
  const [open, setOpen] = useState(false);

  const { data: response, isLoading } = useSWRImmutable<
    IResponseMessage<InstagramNamespace.Account[]>
  >(`${API_URL}/instagram/accounts`, fetcher, { revalidateOnMount: true });

  const accounts = response?.data;

  useEffect(() => {
    if (accounts && accounts.length > 0 && selectedIds.length === 0) {
      onChange(accounts.map((acc) => acc.id));
    }
  }, [accounts]);

  if (isLoading || !accounts || accounts.length === 0) return null;

  // Single account: non-interactive display
  if (accounts.length === 1) {
    const acc = accounts[0];
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-violet-200 bg-white px-4 py-2 w-fit shadow-sm">
        <AccountAvatar account={acc} size={28} />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-gray-800">
            {acc.name}
          </span>
          <span className="text-xs text-gray-400">@{acc.username ?? ""}</span>
        </div>
      </div>
    );
  }

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) return;
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedAccounts = accounts.filter((a) => selectedIds.includes(a.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-h-11 w-full max-w-sm items-center justify-between gap-3 rounded-xl border bg-white px-4 py-2 text-sm shadow-sm transition-colors",
            open
              ? "border-violet-400 ring-2 ring-violet-100"
              : "border-gray-200 hover:border-violet-300",
          )}
        >
          <div className="flex flex-1 flex-wrap gap-2 overflow-hidden">
            {selectedAccounts.length === 0 ? (
              <span className="text-muted-foreground text-[13px]">
                انتخاب اکانت...
              </span>
            ) : (
              selectedAccounts.map((acc) => (
                <span
                  key={acc.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700"
                >
                  <AccountAvatar account={acc} size={18} />
                  @{acc.username ?? acc.name}
                </span>
              ))
            )}
          </div>
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 text-gray-400 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-2" align="start" sideOffset={8}>
        <div className="space-y-1">
          {accounts.map((acc) => {
            const isSelected = selectedIds.includes(acc.id);
            const isOnlySelected = isSelected && selectedIds.length === 1;

            return (
              <button
                key={acc.id}
                type="button"
                disabled={isOnlySelected}
                onClick={() => toggle(acc.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isSelected
                    ? "bg-violet-50 text-violet-800"
                    : "text-gray-700 hover:bg-gray-50",
                  isOnlySelected && "opacity-50 cursor-not-allowed",
                )}
              >
                <AccountAvatar account={acc} size={36} />
                <div className="min-w-0 flex-1 text-start">
                  <div className="truncate font-semibold leading-tight">
                    {acc.name}
                  </div>
                  <div className="truncate text-xs text-gray-400 mt-0.5">
                    @{acc.username ?? ""}
                  </div>
                </div>
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    isSelected
                      ? "border-violet-600 bg-violet-600"
                      : "border-gray-300 bg-white",
                  )}
                >
                  {isSelected && (
                    <CheckIcon className="size-3 text-white" strokeWidth={3} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AccountAvatar({
  account,
  size,
}: {
  account: InstagramNamespace.Account;
  size: number;
}) {
  const [imgError, setImgError] = useState(false);

  if (account.profilePictureUrl && !imgError) {
    return (
      <img
        src={account.profilePictureUrl}
        alt={account.username ?? account.name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <InstagramLogoIcon size={size} className="shrink-0 text-gray-400" />
  );
}

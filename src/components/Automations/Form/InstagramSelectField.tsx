"use client";

import { fetcher } from "@/hooks/swr/api-client";
import { cn } from "@/lib/utils";
import { InstagramNamespace } from "@/types/instagram";
import { InstagramLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import useSWRImmutable from "swr/immutable";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const API_URL = process.env.NEXT_PUBLIC_BACK_API_URL;

export function InstagramSelectField({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Automations");
  const { control } = useFormContext();

  const { data: accounts, isLoading } = useSWRImmutable<
    InstagramNamespace.Account[]
  >(`${API_URL}/instagram/accounts`, fetcher, { revalidateOnMount: true });

  if (isLoading || !accounts || accounts.length === 0) return null;

  return (
    <FormField
      control={control}
      name="instagramId"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium text-gray-700">
            {t("instagram_account")}
          </FormLabel>
          <FormControl>
            <Popover open={open && !disabled} onOpenChange={disabled ? undefined : setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-lg border bg-white px-3 text-sm shadow-sm transition-colors",
                    open
                      ? "border-violet-400 ring-2 ring-violet-100"
                      : "border-gray-200 hover:border-violet-300",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  <SelectedAccount
                    account={accounts.find((a) => a.id === field.value)}
                  />
                  {!disabled && (
                    <ChevronDownIcon
                      className={cn(
                        "ms-auto size-4 shrink-0 text-gray-400 transition-transform duration-200",
                        open && "rotate-180",
                      )}
                    />
                  )}
                </button>
              </PopoverTrigger>

              <PopoverContent className="w-72 p-1.5" align="start" sideOffset={6}>
                <div className="space-y-0.5">
                  {accounts.map((acc) => {
                    const isSelected = field.value === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          field.onChange(acc.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                          isSelected
                            ? "bg-violet-50 text-violet-800"
                            : "text-gray-700 hover:bg-gray-50",
                        )}
                      >
                        <AccountAvatar account={acc} size={32} />
                        <div className="min-w-0 flex-1 text-start">
                          <div className="truncate font-medium leading-tight">
                            {acc.name}
                          </div>
                          <div className="truncate text-xs text-gray-500">
                            @{acc.username ?? ""}
                          </div>
                        </div>
                        <CheckIcon
                          className={cn(
                            "size-4 shrink-0 transition-opacity",
                            isSelected
                              ? "text-violet-600 opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SelectedAccount({
  account,
}: {
  account: InstagramNamespace.Account | undefined;
}) {
  if (!account) {
    return (
      <span className="text-muted-foreground text-[13px]">انتخاب اکانت...</span>
    );
  }

  return (
    <span className="flex items-center gap-2 min-w-0">
      <AccountAvatar account={account} size={24} />
      <span className="truncate font-medium text-gray-800">
        @{account.username ?? account.name}
      </span>
    </span>
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
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return <InstagramLogoIcon size={size} className="shrink-0 text-gray-400" />;
}

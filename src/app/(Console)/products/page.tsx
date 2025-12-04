"use client";

import { useHeaderFeatures } from "@/lib/stores/useHeaderFeaturesStore";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { LayoutCard } from "@/components/Layout/LayoutCard";
import { ProducstCardList } from "@/components/Products/ProducstCardList";
import { Button } from "@/components/ui";
import { SearchInput } from "@/components/ui-custom/SearchInput";
import { SearchToggleButton } from "@/components/ui-custom/SearchToggleButton";
import { CircleFadingPlusIcon } from "lucide-react";
import useSWRImmutable from "swr/immutable";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Page() {
  const router = useRouter();
  const t = useTranslations("Products");
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [effectiveSearch, setEffectiveSearch] = useState<string>("");

  const { setTools, clearTools, setButtons, clearButtons, error } =
    useHeaderFeatures((s) => ({
      setTools: s.setTools,
      clearTools: s.clearTools,
      setButtons: s.setButtons,
      clearButtons: s.clearButtons,
      error: s.error,
    }));

  const { data: cardToCardData } = useSWRImmutable(`/payments/cardToCard`, {
    revalidateOnMount: true,
  });

  const allowAdd = !!cardToCardData;

  const HeaderButton = useMemo(() => {
    return (
      <>
        <SearchToggleButton
          isSearchVisible={isSearchVisible}
          setIsSearchVisible={setIsSearchVisible}
        />

        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <Button type="button" size="md" disabled={error || !allowAdd}>
              {t("add")}
              <CircleFadingPlusIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push("/products/add?t=p")}
              >
                افزودن کالا
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/products/add?t=v")}
              >
                افزودن ویترین
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  }, [isSearchVisible, setIsSearchVisible, error, router, allowAdd]);

  const HeaderTools = useMemo(
    () => (
      <SearchInput
        value={search}
        onChange={setSearch}
        onEffectiveSearchChange={setEffectiveSearch}
        visible={isSearchVisible}
        disabled={error}
      />
    ),
    [search, isSearchVisible, setSearch, error, setEffectiveSearch],
  );

  useEffect(() => {
    setButtons(HeaderButton);
    setTools(HeaderTools);

    return () => {
      clearButtons();
      clearTools();
    };
  }, [
    HeaderButton,
    HeaderTools,
    setButtons,
    setTools,
    clearButtons,
    clearTools,
  ]);

  return (
    <LayoutCard className="_products">
      <ProducstCardList search={effectiveSearch} allowAdd={allowAdd} />
    </LayoutCard>
  );
}

// Refactored
"use client";

import { useHeaderFeatures } from "@/lib/stores/useHeaderFeaturesStore";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  AutomationsCardList,
  Button,
  LayoutCard,
  SearchInput,
  SearchToggleButton,
} from "@components";
import { CircleFadingPlusIcon } from "lucide-react";

export default function Page() {
  const router = useRouter();
  const t = useTranslations("Automations");
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

  const HeaderButton = useMemo(() => {
    return (
      <>
        <SearchToggleButton
          isSearchVisible={isSearchVisible}
          setIsSearchVisible={setIsSearchVisible}
        />
        <Button
          type="button"
          size="md"
          onClick={() => router.push("/automations/add")}
          disabled={error}
        >
          {t("add")}
          <CircleFadingPlusIcon />
        </Button>
      </>
    );
  }, [isSearchVisible, setIsSearchVisible, error, router]);

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
    <LayoutCard className="_automation overflow-auto">
      <AutomationsCardList search={effectiveSearch} />
    </LayoutCard>
  );
}

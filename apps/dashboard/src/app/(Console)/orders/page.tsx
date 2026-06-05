"use client";

import { useHeaderFeatures } from "@/lib/stores/useHeaderFeaturesStore";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { LayoutCard } from "@/components/Layout/LayoutCard";
import { OrdersCardList } from "@/components/Orders/OrdersCardList";
import { Button } from "@/components/ui";
import { SearchInput } from "@/components/ui-custom/SearchInput";
import { SearchToggleButton } from "@/components/ui-custom/SearchToggleButton";
import { DownloadIcon } from "lucide-react";
import { ExcelExportOrdersDrawer } from "./components/excelExportOrders.drawer";
import { usePermissions } from "@/hooks/usePermissions";

export default function Page() {
  const router = useRouter();
  const t = useTranslations("Orders");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [effectiveSearch, setEffectiveSearch] = useState<string>("");

  const setTools = useHeaderFeatures((s) => s.setTools);
  const clearTools = useHeaderFeatures((s) => s.clearTools);
  const setButtons = useHeaderFeatures((s) => s.setButtons);
  const clearButtons = useHeaderFeatures((s) => s.clearButtons);
  const error = useHeaderFeatures((s) => s.error);

  const { can } = usePermissions();

  const HeaderButton = useMemo(() => {
    return (
      <>
        <SearchToggleButton
          isSearchVisible={isSearchVisible}
          setIsSearchVisible={setIsSearchVisible}
        />
        {can("order:manage") && (
          <Button
            type="button"
            size="md"
            onClick={() => setExportDialogOpen(true)}
            disabled={error}
          >
            {t("ExcelExport.title")}
            <DownloadIcon />
          </Button>
        )}
      </>
    );
  }, [isSearchVisible, setIsSearchVisible, error, router, can]);

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
  }, [HeaderButton, HeaderTools, setButtons, setTools]);

  useEffect(() => {
    return () => {
      clearButtons();
      clearTools();
    };
  }, [clearButtons, clearTools]);

  return (
    <LayoutCard className="_products">
      <ExcelExportOrdersDrawer
        onOpenChange={setExportDialogOpen}
        open={exportDialogOpen}
      />
      <OrdersCardList search={effectiveSearch} />
    </LayoutCard>
  );
}

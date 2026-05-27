"use client";

import { useDebounce } from "@/hooks/useDebounce";
import { useHeaderFeatures } from "@/lib/stores/useHeaderFeaturesStore";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { ContactsList } from "@/components/Contacts/ContactsList";
import { LayoutTable } from "@/components/Layout/LayoutTable";
import { SearchInput } from "@/components/ui-custom/SearchInput";
import { SearchToggleButton } from "@/components/ui-custom/SearchToggleButton";
import { ExcelExportContactsDrawer } from "./components/excelExportContacts.drawer";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

export default function Page() {
  const t = useTranslations("Contacts");

  const setTools = useHeaderFeatures((s) => s.setTools);
  const setButtons = useHeaderFeatures((s) => s.setButtons);
  const clearTools = useHeaderFeatures((s) => s.clearTools);
  const clearButtons = useHeaderFeatures((s) => s.clearButtons);

  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);
  const normalized = debouncedSearch.trim();
  const effectiveSearch = normalized.length >= 2 ? normalized : "";

  const HeaderButton = useMemo(
    () => (
      <SearchToggleButton
        isSearchVisible={isSearchVisible}
        setIsSearchVisible={setIsSearchVisible}
      />
    ),
    [isSearchVisible, setIsSearchVisible],
  );

  const { can } = usePermissions();

  const HeaderTools = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          visible={isSearchVisible}
        />
        {can("lead:export") && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsExportOpen(true)}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    ),
    [search, isSearchVisible, setSearch, can],
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
    <LayoutTable className="_contacts">
      <ContactsList search={effectiveSearch} />
      <ExcelExportContactsDrawer
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
      />
    </LayoutTable>
  );
}

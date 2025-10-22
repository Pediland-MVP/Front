// src/components/SearchInput.tsx
"use client";

import { Input } from "@components";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onEffectiveSearchChange?: (effectiveSearch: string) => void;
  placeholder?: string;
  visible?: boolean;
  disabled?: boolean;
};

export const SearchInput = ({
  value,
  onChange,
  onEffectiveSearchChange,
  placeholder,
  visible = true,
  disabled = false,
}: Props) => {
  const t = useTranslations("Components.SearchInput");

  const debouncedSearch = useDebounce(value, 300);
  const normalized = debouncedSearch.trim();
  const effectiveSearch = normalized.length >= 2 ? normalized : "";

  useEffect(() => {
    if (onEffectiveSearchChange) {
      onEffectiveSearchChange(effectiveSearch);
    }
  }, [effectiveSearch, onEffectiveSearchChange]);

  return (
    <Input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\s+/g, " "))}
      placeholder={placeholder || t("search_placeholder")}
      aria-label={t("search_placeholder")}
      className={visible ? "mt-2 flex" : "hidden h-9 xl:flex"}
      disabled={disabled}
    />
  );
};

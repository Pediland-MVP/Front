// src/components/SearchInput.tsx
"use client";

import { Input } from "@befroosh/ui";
import { useTranslations } from "next-intl";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  visible?: boolean;
};

export const SearchInput = ({
  value,
  onChange,
  placeholder,
  visible = true,
}: Props) => {
  const t = useTranslations("Components.SearchInput");

  return (
    <Input
      type="search"
      value={value}
      onChange={(e: any) => onChange(e.target.value.replace(/\s+/g, " "))}
      placeholder={placeholder || t("search_placeholder")}
      aria-label={t("search_placeholder")}
      className={visible ? "flex mt-1.5" : "hidden xl:flex"}
    />
  );
};

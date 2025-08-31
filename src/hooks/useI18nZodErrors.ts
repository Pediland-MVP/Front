// src/lib/useI18nZodErrors.ts
"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { makeZodI18nMap } from "./zodErrorMap";

export const useI18nZodErrors = () => {
  const t = useTranslations("zod");
  const tForm = useTranslations("form");
  const tCustom = useTranslations("customErrors");

  useEffect(() => {
    z.setErrorMap(makeZodI18nMap({ t, tForm, tCustom }));
  }, [t, tForm, tCustom]);
};

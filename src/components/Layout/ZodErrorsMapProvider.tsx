// src/components/Layout/zodErrorsMapProvider.tsx
"use client";
import { useI18nZodErrors } from "@/hooks/useI18nZodErrors";
import { ReactNode } from "react";

export const ZodErrorsMapProvider = ({ children }: { children: ReactNode }) => {
  useI18nZodErrors();
  return children;
};

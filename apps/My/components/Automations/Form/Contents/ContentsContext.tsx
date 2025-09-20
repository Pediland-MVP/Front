// src/components/Automations/form/Contents/useContentsContext.tsx
"use client";

import { AutomationFormType } from "@/schemas/automationForm";
import { createContext, useContext } from "react";

type ContentsContextType = {
  updateContents: (index: number, content: any) => void;
  removeContents: (index: number) => void;
  contents:
    | AutomationFormType["contents"]
    | AutomationFormType["reminders"];
};

export const ContentsContext = createContext<ContentsContextType | null>(null);

export const useContentsContext = () => {
  const context = useContext(ContentsContext);

  if (context === null) {
    throw new Error(
      "useContentsContext must be used within a ContentsContextProvider",
    );
  }
  return context;
};

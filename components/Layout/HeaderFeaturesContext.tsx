"use client";

import type React from "react";
import { createContext, useContext, useState, type ReactNode } from "react";

type HeaderFeaturesContextType = {
  setTools: (tools: ReactNode) => void;
  clearTools: () => void;
  tools: ReactNode;
  setButtons: (buttons: ReactNode) => void;
  clearButtons: () => void;
  buttons: ReactNode;
};

const HeaderFeaturesContext = createContext<
  HeaderFeaturesContextType | undefined
>(undefined);

export const HeaderFeaturesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [tools, setTools] = useState<ReactNode | null>(null);
  const [buttons, setButtons] = useState<ReactNode | null>(null);

  const clearTools = () => setTools(null);
  const clearButtons = () => setButtons(null);

  return (
    <HeaderFeaturesContext.Provider
      value={{ setTools, clearTools, tools, setButtons, clearButtons, buttons }}
    >
      {children}
    </HeaderFeaturesContext.Provider>
  );
};

export const useHeaderFeatures = () => {
  const context = useContext(HeaderFeaturesContext);
  if (context === undefined) {
    throw new Error(
      "useHeaderFeatures must be used within a HeaderFeaturesProvider"
    );
  }
  return context;
};

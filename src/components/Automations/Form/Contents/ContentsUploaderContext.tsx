// src/components/Automations/form/Contents/useContentsUploaderContext.tsx
"use client";

import { UploadedFile } from "@/types/fileUploader";
import { createContext, useContext, useEffect, useState } from "react";

export type ContentsUploaderContextType = {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
};

const ContentsUploaderContext =
  createContext<ContentsUploaderContextType | null>(null);

export const ContentsUploaderContextProvider = ({
  children,
  defaultValue,
}: {
  children: React.ReactNode;
  defaultValue: UploadedFile;
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDefaultValue, setIsDefaultValue] = useState(false);
  useEffect(() => {
    if (!isDefaultValue) {
      if (defaultValue) {
        setFiles([defaultValue]);
      }
      setIsDefaultValue(true);
    }
  }, [defaultValue]);

  return (
    <ContentsUploaderContext.Provider value={{ files, setFiles }}>
      {children}
    </ContentsUploaderContext.Provider>
  );
};

export const useContentsUploaderContext = () => {
  const context = useContext(ContentsUploaderContext);
  if (context === null) {
    throw new Error(
      "useContentsUploaderContext must be used within a ContentsUploaderContextProvider",
    );
  }
  return context;
};

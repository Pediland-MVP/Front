// src/components/Automations/form/Contents/useContentsContext.tsx
'use client';

import { AutomationFormType } from '../schemas/automationForm';
import type { AutomationBuilderMode } from '../AutomationBuilder.types';
import { createContext, useContext } from 'react';

type ContentsContextType = {
  updateContents: (index: number, content: any) => void;
  removeContents: (index: number) => void;
  contents: AutomationFormType['contents'] | AutomationFormType['reminders'];
  // Which builder is rendering these contents. Templates (admin) can't embed a
  // "start automation" button — there is no workspace automation to point at, and
  // any id would dangle once a user creates an automation from the template.
  builderMode: AutomationBuilderMode;
};

export const ContentsContext = createContext<ContentsContextType | null>(null);

export const useContentsContext = () => {
  const context = useContext(ContentsContext);

  if (context === null) {
    throw new Error('useContentsContext must be used within a ContentsContextProvider');
  }
  return context;
};

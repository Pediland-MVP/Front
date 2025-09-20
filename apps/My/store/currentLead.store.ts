import { leadNamespace } from "@/types/lead";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type UseCurrentLeadType = {
  currentLead?: leadNamespace.GET["One"];
  setCurrentLead: (lead: leadNamespace.GET["One"]) => void;
};

const useCurrentLead = create<UseCurrentLeadType>()(
  devtools((set) => ({
    currentLead: undefined,
    setCurrentLead: (lead: leadNamespace.GET["One"]) =>
      set((state: UseCurrentLeadType) => ({ ...state, currentLead: lead })),
  })),
);

export default useCurrentLead;

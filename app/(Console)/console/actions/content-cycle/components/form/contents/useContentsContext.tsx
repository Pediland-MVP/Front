import { createContext, useContext } from "react";
import { contentCycleFormSchema } from '../../contentCycle';
import { z } from "zod";

type ContentsContextType = {
    updateContents: (index: number, content: any) => void
    removeContents: (index: number) => void
    contents: z.infer<typeof contentCycleFormSchema>['contents']
}
export const ContentsContext = createContext<ContentsContextType | null>(null);

export const useContentsContext = () => {
    const context = useContext(ContentsContext);
    if (context === null) {
        throw new Error("useContentsContext must be used within a ContentsContextProvider");
    }
    return context;
}
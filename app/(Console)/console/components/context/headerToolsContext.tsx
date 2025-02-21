"use client"

import type React from "react"
import { createContext, useContext, useState, type ReactNode } from "react"

type HeaderToolsContextType = {
    setTools: (tools: ReactNode) => void
    clearTools: () => void
    tools: ReactNode
}

const HeaderToolsContext = createContext<HeaderToolsContextType | undefined>(undefined)

export const HeaderToolsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tools, setTools] = useState<ReactNode | null>(null)

    const clearTools = () => setTools(null)

    return <HeaderToolsContext.Provider value={{ setTools, clearTools, tools }}>{children}</HeaderToolsContext.Provider>
}

export const useHeaderTools = () => {
    const context = useContext(HeaderToolsContext)
    if (context === undefined) {
        throw new Error("useHeaderTools must be used within a HeaderToolsProvider")
    }
    return context
}

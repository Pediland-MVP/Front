'use client'
import { useI18nZodErrors } from "@/lib/useI18nZodErrors"

export function ZodErrorsMapProvider({ children }: { children: React.ReactNode }) {
    useI18nZodErrors()
    return children
}
'use client'
import { mutate } from "swr";

export const mutateIncludeStringKey = (value: string) => mutate(key => typeof key === "string" && key.includes(value))
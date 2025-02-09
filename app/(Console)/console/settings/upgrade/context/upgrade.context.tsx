'use client'

import { PlanNamespace } from "@/types/plans/plan.namespace";
import { SubscriptionNamespace } from "@/types/subscriptions/subscription.namspace";
import { createContext, useState, use, useContext, useEffect } from 'react';
import { usePlanSelection } from "../hooks/usePlanSelection";
import useSWRImmutable from "swr/immutable";

export interface UpgradeContext {
    active: {
        subscriptionInfo: boolean,
        planSelection: boolean
    },
    setActive: React.Dispatch<React.SetStateAction<{
        subscriptionInfo: boolean,
        planSelection: boolean
    }>>,
    subscriptions: SubscriptionNamespace.GET.Subscriptions['items'],
    plans: PlanNamespace.GET.Plans
}

export const UpgradeContext = createContext<UpgradeContext | null>(null)

export function UpgradeProvider({ children }: { children: React.ReactNode }) {
    const [active, setActive] = useState({
        subscriptionInfo: false,
        planSelection: false
    })

    const { data: subscriptionsData, isLoading: isSubscriptionsLoading, error: subscriptionsError  } = useSWRImmutable<SubscriptionNamespace.GET.Subscriptions>(`${process.env.NEXT_PUBLIC_BACK_API_URL}/subscriptions?page=1&limit=5&status=active,reserved`)
    const { plans, isPlansLoading } = usePlanSelection();

    useEffect(() => {

        if (!subscriptionsData?.items?.length) {
            setActive({
                subscriptionInfo: false,
                planSelection: true
            })
            return 
        }

        if (subscriptionsData?.items.length) {
            setActive({
                subscriptionInfo: true,
                planSelection: false
            })
        }

    }, [subscriptionsData, plans])

    if (isSubscriptionsLoading || isPlansLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl font-semibold">درحال بارگذاری...</span>
            </div>
        )
    }

    return (
        <UpgradeContext.Provider value={{ active, setActive, subscriptions: subscriptionsData?.items!, plans: plans! }}>
            {children}
        </UpgradeContext.Provider>
    )
}


export function useUpgradeContext() {
    const context = useContext(UpgradeContext)
    if (!context) {
        throw new Error("useUpgradeContext must be used within a UpgradeProvider")
    }
    return context
}
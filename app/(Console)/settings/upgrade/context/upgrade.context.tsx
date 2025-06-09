'use client'

import { PlanNamespace } from "@/types/plans/plan.namespace";
import { SubscriptionNamespace } from "@/types/subscriptions/subscription.namspace";
import { createContext, useState, use, useContext, useEffect } from 'react';
import { usePlanSelection } from "../hooks/usePlanSelection";
import useSWRImmutable from "swr/immutable";
import LoadingSpinner from "@/components/theme/ui/loadingSpinner";
import useSWR from "swr";
import { AxiosError } from "axios";
import useUser from "@/hooks/useUser";

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
    plans: PlanNamespace.GET.PlansData['plans']
    plansData?: PlanNamespace.GET.PlansData,
    discountCode?: string,
    setDiscountCode: React.Dispatch<React.SetStateAction<string>>
}

export const UpgradeContext = createContext<UpgradeContext | null>(null)

export function UpgradeProvider({ children }: { children: React.ReactNode }) {
    const [active, setActive] = useState({
        subscriptionInfo: false,
        planSelection: false
    })

    const [discountCode, setDiscountCode] = useState<string>('')

    const { data: subscriptionsData, isLoading: isSubscriptionsLoading, error: subscriptionsError } = useSWRImmutable<SubscriptionNamespace.GET.Subscriptions>(`${process.env.NEXT_PUBLIC_BACK_API_URL}/subscriptions?page=1&limit=5&status=active,reserved`, {
        revalidateOnMount: true,
        refreshInterval: 30_000
    })
    
    const { isAuthenticated } = useUser()
    const { data: plansData, isLoading: isPlansLoading, error: plansError, mutate } = useSWR<PlanNamespace.GET.PlansData, AxiosError>(isAuthenticated ? `${process.env.NEXT_PUBLIC_BACK_API_URL}/plans${discountCode ? `?discountCode=${discountCode}` : ''}` : null)
    const plans = plansData?.plans

    useEffect(() => {
        if( plans) {
            console.log('Plans updated on CONTEXT', plansData);
            
        }
    }, [plans])

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
            <LoadingSpinner className="h-full" />
        )
    }

    return (
        <UpgradeContext.Provider value={{ active, setActive, subscriptions: subscriptionsData?.items!, plans: plans!, plansData, discountCode, setDiscountCode }}>
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
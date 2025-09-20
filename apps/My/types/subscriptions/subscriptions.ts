import { SubscriptionStatusEnum } from "./enums/subscriptionStatus.enum";

export interface ISubscriptions {
    items: Subscription[];
    meta: Meta;
}

interface Subscription {
    id: string;
    createDate: string;
    updateDate: string;
    expire: string;
    status: SubscriptionStatusEnum;
    planDurationId: number;
    userId: string;
    planDuration: PlanDuration;
}

interface PlanDuration {
    id: number;
    createDate: string;
    updateDate: string;
    name: string;
    price: number;
    durationDays: number;
    planId: number;
}

interface Meta {
    itemCount: number;
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
}
